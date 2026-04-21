const sql = require("mssql/msnodesqlv8");

const dbConfig = {
  connectionString: "Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;",
  options: { trustServerCertificate: true },
};

sql.connect(dbConfig).then(pool => {
  return pool.request().query(`
    UPDATE Horario 
    SET hora_inicio = '10:00:00', 
        hora_fim = '19:30:00'
    WHERE CAST(hora_inicio AS TIME) < '10:00:00'
  `);
}).then(r => {
  console.log("Horários atualizados! Linhas afetadas:", r.rowsAffected[0]);
  
  // Verificar horários atuais
  return pool.request().query("SELECT * FROM Horario");
}).then(r => {
  console.log("\nHorários atuais:");
  console.table(r.recordset);
  process.exit();
}).catch(e => {
  console.error("Erro:", e.message);
  process.exit(1);
});