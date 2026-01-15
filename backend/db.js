const sql = require('mssql');

const config = {
  server: 'ERCERC-VKKKCOPK',
  database: 'Barbearia',
  user: 'pap_user',
  password: 'Pap123!',
  options: {
    trustServerCertificate: true
  }
};

async function connectDB() {
  try {
    await sql.connect(config);
    console.log('Ligado ao SQL Server com sucesso ✅');
  } catch (err) {
    console.error('Erro ao ligar à BD ❌', err.message);
  }
}

module.exports = {
  sql,
  connectDB
};
