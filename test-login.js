const fetch = (url, options) => {
  return new Promise((resolve, reject) => {
    const http = require('http');
    const https = require('https');

    const protocol = url.startsWith('https://') ? https : http;
    const urlObj = new URL(url);

    const req = protocol.request({
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options?.method || 'GET',
      headers: options?.headers || {}
    }, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        res.text = () => Promise.resolve(body);
        res.json = () => Promise.resolve(JSON.parse(body));
        resolve(res);
      });
    });

    req.on('error', reject);

    if (options?.body) {
      req.write(options.body);
    }

    req.end();
  });
};

async function testLogin() {
  const url = 'http://localhost:3000/cliente/login';
  const credentials = {
    email: 'teste@exemplo.com',
    senha: 'teste123'
  };

  console.log('Testando login com:', credentials);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(credentials)
    });

    const data = await response.json();
    console.log('Status da resposta:', response.status);
    console.log('Resposta:', data);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

async function testRegister() {
  const url = 'http://localhost:3000/register';
  const userData = {
    nome: 'Teste User',
    email: 'teste@exemplo.com',
    telefone: '912345678',
    senha: 'teste123'
  };

  console.log('Testando registo com:', userData);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });

    const data = await response.json();
    console.log('Status da resposta:', response.status);
    console.log('Resposta:', data);
  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Executar testes
testLogin();
// testRegister(); // Descomentar para testar registo
