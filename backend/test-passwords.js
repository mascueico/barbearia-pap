const bcrypt = require('bcryptjs');

// Senhas armazenadas (obtidas do check-schema.js)
const storedPasswords = {
  'martimjosesilva2008pt@gmail.com': '$2b$10$1numWDW6oHveF0XPVg/NHu8QkgXCiWma/BtHYg6Qx5a4ckPbpnk7i',
  'martimgoncalo08@gmail.com': '$2b$10$0FjT.7NMV8OEIQyLLIOemeAvUnfuCm4SjWkZhtE3XhbT7f11aPXxm',
  'admin@barbearia.pt': '$2b$10$of5H4Yq5TSwzjJq5Y09g1ueQOMqD8lO1kBusTfSRFpkQ48uW.J5YO'
};

// Senhas comuns para testar
const commonPasswords = ['1234', '12345', '123456', 'password', 'senha', 'admin', 'martim', 'martim123', 'test'];

const main = async () => {
  console.log('🔍 Testando senhas comuns contra as hashes armazenadas...\n');
  
  for (const [email, hashedPassword] of Object.entries(storedPasswords)) {
    console.log(`📧 ${email}`);
    
    let found = false;
    for (const password of commonPasswords) {
      const match = await bcrypt.compare(password, hashedPassword);
      if (match) {
        console.log(`✅ Senha encontrada: ${password}`);
        found = true;
        break;
      }
    }
    
    if (!found) {
      console.log('❌ Senha não encontrada nos padrões comuns');
    }
    
    console.log('');
  }
};

main();
