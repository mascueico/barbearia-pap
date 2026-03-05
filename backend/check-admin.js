const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
    options: { trustServerCertificate: true }
};

async function checkAdmin() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Ligado ao SQL Server (Windows Auth)');

        const result = await pool.request().query('SELECT * FROM Administradores');

        console.log('✅ Dados do admin:');
        console.log(result.recordset);
    } catch (err) {
        console.error('❌ Erro ao consultar admin:', err.message);
    }
}

checkAdmin();
