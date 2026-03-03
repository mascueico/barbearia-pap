const sql = require('mssql/msnodesqlv8');
const bcrypt = require('bcryptjs');

const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
  options: { trustServerCertificate: true }
};

const main = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    console.log('🔗 Conectado à base de dados');
    
    // Obter clientes
    const clientes = await pool.request().query('SELECT email, palavra_passe FROM Clientes');
    console.log('\n📋 Clientes:');
    for (const cliente of clientes.recordset) {
      console.log(`- ${cliente.email}`);
      console.log(`  Palavra-passe armazenada: ${cliente.palavra_passe.substring(0, 20)}...`);
      console.log(`  É hash bcrypt válido? ${cliente.palavra_passe.length === 60 && cliente.palavra_passe.startsWith('$2a$')}`);
      
      // Tentar verificar algumas senhas comuns
      const commonPasswords = ['1234', 'senha123', 'martim123', 'password'];
      for (const password of commonPasswords) {
        const match = await bcrypt.compare(password, cliente.palavra_passe);
        if (match) {
          console.log(`  ✅ Senha correta: ${password}`);
        }
      }
    }
    
    // Obter admin
    const admin = await pool.request().query('SELECT email, palavra_passe FROM Administradores');
    console.log('\n👑 Administrador:');
    for (const a of admin.recordset) {
      console.log(`- ${a.email}`);
      console.log(`  Palavra-passe armazenada: ${a.palavra_passe.substring(0, 20)}...`);
      console.log(`  É hash bcrypt válido? ${a.palavra_passe.length === 60 && a.palavra_passe.startsWith('$2a$')}`);
      
      const commonPasswords = ['1234', 'admin', 'senha123'];
      for (const password of commonPasswords) {
        const match = await bcrypt.compare(password, a.palavra_passe);
        if (match) {
          console.log(`  ✅ Senha correta: ${password}`);
        }
      }
    }
    
    await pool.close();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
};

main();
