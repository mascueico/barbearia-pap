async function login() {
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg = document.getElementById('msg');

  msg.textContent = '';

  if (!email || !password) {
    msg.style.color = 'red';
    msg.textContent = 'Preenche o email e a palavra-passe.';
    return;
  }

  try {
    const response = await fetch('http://localhost:3000/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, palavra_passe: password })
    });

    const data = await response.json();

    if (!response.ok) {
      msg.style.color = 'red';
      msg.textContent = data.mensagem || data.erro || 'Erro no login.';
      return;
    }

    // Guardar “sessão” simples (para PAP chega; depois melhoramos com token)
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminEmail', email);

    msg.style.color = 'lightgreen';
    msg.textContent = 'Login com sucesso!';

    // Redirecionar para o dashboard
    window.location.href = 'dashboard.html';
  } catch (err) {
    msg.style.color = 'red';
    msg.textContent = 'Não foi possível ligar ao servidor (backend).';
  }
}

document.getElementById('btnLogin').addEventListener('click', login);

// Enter também faz login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') login();
});
