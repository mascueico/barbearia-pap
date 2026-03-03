const bcrypt = require('bcryptjs');
const sql = require('mssql/msnodesqlv8');

const dbConfig = {
  connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=ERCERC-VKKKCOPK;Database=Barbearia;Trusted_Connection=Yes;',
  options: { trustServerCertificate: true }
};

const main = async () => {
  try {
    const pool = await sql.connect(dbConfig);
    
    // Obter clientes e senhas
    const clientes = await pool.request().query('SELECT email, senha FROM Clientes');
    
    // Mostrar as senhas em texto simples usando um script que capturou as senhas originais
    // ou testar senhas comuns
    for (const cliente of clientes.recordset) {
      console.log('📧 Email:', cliente.email);
      console.log('🔐 Senha armazenada:', cliente.senha);
      
      // Testar algumas senhas que poderiam ser as originais (baseadas em nomes)
      const testPasswords = [
        'martim',
        'martim123',
        'martimgoncalo',
        '123456',
        'senha',
        'password',
        'flokiko',
        'barbearia'
      ];
      
      for (const testPass of testPasswords) {
        const match = await bcrypt.compare(testPass, cliente.senha);
        if (match) {
          console.log('✅ Senha correta:', testPass);
        }
      }
      
      console.log('');
    }
    
    await pool.close();
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
};

main();
