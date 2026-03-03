const sql = require('mssql/msnodesqlv8');

const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
  options: { trustServerCertificate: true }
};

const main = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('🔗 Conectado à base de dados');
    
    // Verificar estrutura da tabela Clientes
    const clientesSchema = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Clientes'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📊 Estrutura da tabela Clientes:');
    clientesSchema.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Verificar estrutura da tabela Administradores
    const adminSchema = await pool.request().query(`
      SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'Administradores'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('\n📊 Estrutura da tabela Administradores:');
    adminSchema.recordset.forEach(col => {
      console.log(`- ${col.COLUMN_NAME} (${col.DATA_TYPE}${col.CHARACTER_MAXIMUM_LENGTH ? `(${col.CHARACTER_MAXIMUM_LENGTH})` : ''}) ${col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    // Obter dados dos clientes
    console.log('\n📋 Dados dos Clientes:');
    const clientes = await pool.request().query('SELECT email, senha FROM Clientes');
    clientes.recordset.forEach(cliente => {
      console.log(`- Email: ${cliente.email}`);
      console.log(`  Senha: ${cliente.senha}`);
    });
    
    // Obter dados do administrador
    console.log('\n👑 Dados do Administrador:');
    const admin = await pool.request().query('SELECT email, palavra_passe FROM Administradores');
    admin.recordset.forEach(a => {
      console.log(`- Email: ${a.email}`);
      console.log(`  Senha: ${a.palavra_passe}`);
    });
    
    await pool.close();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
};

main();
