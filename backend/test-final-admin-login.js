const axios = require('axios');

async function testAdminLogin() {
  try {
    const response = await axios.post('http://localhost:3000/login', {
      email: 'admin@barbearia.pt',
      palavra_passe: '1234'
    });
    console.log('✅ Admin login successful');
    console.log('Admin name:', response.data.admin);
  } catch (error) {
    console.error('❌ Admin login failed');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    } else {
      console.error('Error:', error.message);
    }
  }
}

async function testUserLogins() {
  const users = [
    { email: 'martimgoncalo08@gmail.com', password: 'teste123' },
    { email: 'martimjosesilva2008pt@gmail.com', password: 'teste123' }
  ];

  for (const user of users) {
    try {
      const response = await axios.post('http://localhost:3000/cliente/login', {
        email: user.email,
        senha: user.password
      });
      console.log(`✅ User login successful for ${user.email}`);
      console.log('User name:', response.data.cliente.nome_cliente);
    } catch (error) {
      console.error(`❌ User login failed for ${user.email}`);
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
      } else {
        console.error('Error:', error.message);
      }
    }
  }
}

async function main() {
  console.log('=== Admin Login Test ===');
  await testAdminLogin();
  
  console.log('\n=== User Login Tests ===');
  await testUserLogins();
}

main();
