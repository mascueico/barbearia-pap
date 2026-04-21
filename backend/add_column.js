const sql = require("mssql/msnodesqlv8");

const dbConfig = {
  connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;",
  options: { trustServerCertificate: true },
};

sql.connect(dbConfig).then(pool => {
  return pool.request().query("ALTER TABLE Clientes ADD palavra_passe NVARCHAR(255)");
}).then(() => {
  console.log("Coluna palavra_passe adicionada com sucesso!");
  process.exit();
}).catch(e => {
  console.error("Erro:", e.message);
  process.exit(1);
});