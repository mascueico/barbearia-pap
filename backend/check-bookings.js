const sql = require('mssql/msnodesqlv8');

const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
    options: { trustServerCertificate: true }
};

async function checkBookings() {
    try {
        let pool = await sql.connect(dbConfig);
        console.log('✅ Ligado ao SQL Server (Windows Auth)');

        const result = await pool.request().query('SELECT * FROM Agendamentos');

        console.log('✅ Agendamentos:');
        console.log(result.recordset);
    } catch (err) {
        console.error('❌ Erro ao consultar agendamentos:', err.message);
    }
}

checkBookings();
