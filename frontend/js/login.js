// Sistema de autenticação de utilizadores (clientes)
document.addEventListener('DOMContentLoaded', function() {
    // Toggle between login and register forms
    const toggleBtns = document.querySelectorAll('.toggle-btn');
    const formSections = document.querySelectorAll('.form-section');

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const formType = this.dataset.form;
            
            // Remove active class from all buttons and forms
            toggleBtns.forEach(b => b.classList.remove('active'));
            formSections.forEach(f => f.classList.remove('active'));
            
            // Add active class to clicked button and corresponding form
            this.classList.add('active');
            document.getElementById(`${formType}-form`).classList.add('active');
            
            // Clear alert
            hideAlert();
        });
    });

    // Check if user is already logged in
    const loggedInUser = getLoggedInUser();
    if (loggedInUser) {
        // Redirect to home or marcar page
        window.location.href = 'index.html';
    }
});

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    hideAlert();

    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log('Login attempt with:', email);

    try {
        const response = await fetch('http://localhost:3000/cliente/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: email,
                senha: password
            })
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (data.ok) {
            // Save user data to localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(data.cliente));
            console.log('User saved to localStorage:', data.cliente);
            
            showAlert('Login realizado com sucesso!', 'success');
            
            // Redirect to marcar page after 1 second
            setTimeout(() => {
                window.location.href = 'marcar.html';
            }, 1000);
        } else {
            showAlert(data.erro || 'Erro ao fazer login', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro de conexão com o servidor', 'error');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    hideAlert();

    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const phone = document.getElementById('register-phone').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;

    // Validate password match
    if (password !== confirmPassword) {
        showAlert('As palavras-passe não coincidem', 'error');
        return;
    }

    // Validate password strength (minimum 6 characters)
    if (password.length < 6) {
        showAlert('A palavra-passe deve ter pelo menos 6 caracteres', 'error');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nome: name,
                email: email,
                telefone: phone,
                senha: password
            })
        });

        const data = await response.json();

        if (data.ok) {
            // Save user data to localStorage
            localStorage.setItem('loggedInUser', JSON.stringify(data.cliente));
            
            showAlert('Registo realizado com sucesso!', 'success');
            
            // Redirect to marcar page after 1 second
            setTimeout(() => {
                window.location.href = 'marcar.html';
            }, 1000);
        } else {
            showAlert(data.erro || 'Erro ao registar', 'error');
        }
    } catch (error) {
        console.error('Erro:', error);
        showAlert('Erro de conexão com o servidor', 'error');
    }
}

// Show alert
function showAlert(message, type) {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert ${type}`;
}

// Hide alert
function hideAlert() {
    const alert = document.getElementById('alert');
    alert.textContent = '';
    alert.className = 'alert';
}

// Get logged in user from localStorage
function getLoggedInUser() {
    const userData = localStorage.getItem('loggedInUser');
    return userData ? JSON.parse(userData) : null;
}

// Toggle password visibility
function togglePasswordVisibility(passwordId, toggleId) {
    console.log("Toggle function called");
    const passwordInput = document.getElementById(passwordId);
    const toggleIcon = document.getElementById(toggleId);
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleIcon.classList.remove('fa-eye');
        toggleIcon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        toggleIcon.classList.remove('fa-eye-slash');
        toggleIcon.classList.add('fa-eye');
    }
}

// Logout function (can be called from other pages)
function logout() {
    localStorage.removeItem('loggedInUser');
    window.location.href = 'login.html';
}
