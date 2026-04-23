const sql = require("mssql/msnodesqlv8");

const dbConfig = {
  connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;",
  options: { trustServerCertificate: true },
};

sql.connect(dbConfig).then(pool => {
  return pool.request().query("SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'Clientes'");
}).then(r => {
  console.log("Colunas:", r.recordset.map(c => c.COLUMN_NAME).join(", "));
  process.exit();
}).catch(e => {
  console.error("Erro:", e.message);
  process.exit(1);
});