const sql = require('mssql/msnodesqlv8');
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
  options: { trustServerCertificate: true }
};

async function createTestUser() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Ligado ao SQL Server');
    
    const result = await pool.request()
      .input('nome', sql.NVarChar(100), 'Teste User')
      .input('email', sql.NVarChar(100), 'teste@example.com')
      .input('telefone', sql.NVarChar(20), '912345678')
      .input('senha', sql.NVarChar(255), 'senha123')
      .query(`
        INSERT INTO Clientes (nome_cliente, email, telefone, senha)
        OUTPUT INSERTED.id_cliente
        VALUES (@nome, @email, @telefone, @senha)
      `);
    
    console.log(`✅ Test user created with id_cliente = ${result.recordset[0].id_cliente}`);
    
    console.log('📋 User details:');
    console.log('- Nome: Teste User');
    console.log('- Email: teste@example.com');
    console.log('- Telefone: 912345678');
    console.log('- Senha: senha123');
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

createTestUser();
