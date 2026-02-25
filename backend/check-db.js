const sql = require('mssql/msnodesqlv8');
const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
  options: { trustServerCertificate: true }
};

async function checkFuncionarios() {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('✅ Ligado ao SQL Server');
    
    const result = await pool.request().query('SELECT * FROM Funcionarios');
    console.log('📋 Funcionários na base de dados:');
    console.log(result.recordset);
    
    const horarioResult = await pool.request().query('SELECT * FROM Horario');
    console.log('📅 Horários na base de dados:');
    console.log(horarioResult.recordset);
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

checkFuncionarios();
