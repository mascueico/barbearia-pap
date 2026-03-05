const bcrypt = require("bcryptjs");
const sql = require("mssql/msnodesqlv8");

// Configuração da base de dados
const dbConfig = {
  connectionString:
    "Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;",
  options: { trustServerCertificate: true },
};

// Função para hash de palavras-passe
const hashPassword = async (password) => {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
};

// Função para verificar se uma string já é um hash bcrypt válido
const isBcryptHash = (str) => {
  return str.length === 60 && (str.startsWith("$2a$") || str.startsWith("$2b$")) && str.includes(".");
};

// Função para hash das palavras-passe existentes na tabela Administradores
const hashAdminPasswords = async (pool) => {
  try {
    console.log("🔍 Buscando administradores com palavras-passe em texto simples...");
    const result = await pool.request().query(`
      SELECT id_admin, nome, email, palavra_passe
      FROM Administradores
    `);

    let updatedCount = 0;

    for (const admin of result.recordset) {
      if (!isBcryptHash(admin.palavra_passe)) {
        console.log(`🚀 Hashing palavra-passe para: ${admin.email}`);
        const hashedPassword = await hashPassword(admin.palavra_passe);
        await pool
          .request()
          .input("id", sql.Int, admin.id_admin)
          .input("hashedPassword", sql.NVarChar(255), hashedPassword)
          .query(`
            UPDATE Administradores
            SET palavra_passe = @hashedPassword
            WHERE id_admin = @id
          `);
        updatedCount++;
        console.log(`✅ Palavra-passe atualizada para: ${admin.email}`);
      } else {
        console.log(`ℹ️  Palavra-passe já está hashed para: ${admin.email}`);
      }
    }

    console.log(`\n✅ Total de administradores com palavras-passe atualizadas: ${updatedCount}`);
    return updatedCount;
  } catch (err) {
    console.error("❌ Erro ao hash das palavras-passe dos administradores:", err.message);
    throw err;
  }
};

// Função para hash das palavras-passe existentes na tabela Clientes
const hashClientPasswords = async (pool) => {
  try {
    console.log("\n🔍 Buscando clientes com palavras-passe em texto simples...");

    // Verificar se a coluna palavra_passe existe na tabela Clientes
    const checkColumnResult = await pool.request().query(`
      SELECT COUNT(*) AS columnCount
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clientes' AND COLUMN_NAME = 'palavra_passe'
    `);

    const hasPalavraPasseColumn = checkColumnResult.recordset[0].columnCount > 0;

    let result;
    if (hasPalavraPasseColumn) {
      result = await pool.request().query(`
        SELECT id_cliente, nome_cliente, email, palavra_passe
        FROM Clientes
        WHERE palavra_passe IS NOT NULL AND palavra_passe != ''
      `);
    } else {
      result = await pool.request().query(`
        SELECT id_cliente, nome_cliente, email, senha
        FROM Clientes
        WHERE senha IS NOT NULL AND senha != ''
      `);
    }

    let updatedCount = 0;

    for (const cliente of result.recordset) {
      const password = hasPalavraPasseColumn ? cliente.palavra_passe : cliente.senha;
      if (!isBcryptHash(password)) {
        console.log(`🚀 Hashing palavra-passe para: ${cliente.email}`);
        const hashedPassword = await hashPassword(password);
        const updateQuery = hasPalavraPasseColumn
          ? `
              UPDATE Clientes
              SET palavra_passe = @hashedPassword
              WHERE id_cliente = @id
            `
          : `
              UPDATE Clientes
              SET senha = @hashedPassword
              WHERE id_cliente = @id
            `;
        await pool
          .request()
          .input("id", sql.Int, cliente.id_cliente)
          .input("hashedPassword", sql.NVarChar(255), hashedPassword)
          .query(updateQuery);
        updatedCount++;
        console.log(`✅ Palavra-passe atualizada para: ${cliente.email}`);
      } else {
        console.log(`ℹ️  Palavra-passe já está hashed para: ${cliente.email}`);
      }
    }

    console.log(`\n✅ Total de clientes com palavras-passe atualizadas: ${updatedCount}`);
    return updatedCount;
  } catch (err) {
    console.error("❌ Erro ao hash das palavras-passe dos clientes:", err.message);
    throw err;
  }
};

// Função principal
const main = async () => {
  let pool;
  try {
    console.log("🔗 Ligando à base de dados...");
    pool = await sql.connect(dbConfig);
    console.log("✅ Ligado à base de dados");

    const adminUpdatedCount = await hashAdminPasswords(pool);
    const clientUpdatedCount = await hashClientPasswords(pool);
    const totalUpdated = adminUpdatedCount + clientUpdatedCount;

    console.log("\n====================================");
    console.log(`✅ Processo concluído!`);
    console.log(`📊 Total de palavras-passe atualizadas: ${totalUpdated}`);
    console.log(`====================================`);

  } catch (err) {
    console.error("❌ Erro no processo:", err.message);
  } finally {
    if (pool) {
      console.log("\n🔌 Desligando da base de dados...");
      await pool.close();
    }
  }
};

// Executar a função principal
main();
