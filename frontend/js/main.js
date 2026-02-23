// Main application JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Update navigation bar based on login status
    updateNavigation();
});

// Update navigation bar based on login status
function updateNavigation() {
    const nav = document.querySelector('nav');
    const loginLink = nav.querySelector('.login-link');
    
    const loggedInUser = getLoggedInUser();
    
    if (loggedInUser) {
        // User is logged in - show account link instead of login
        if (loginLink) {
            loginLink.href = 'conta.html';
            loginLink.textContent = 'Minha Conta';
            loginLink.innerHTML = '<i class="fas fa-user"></i> Minha Conta';
        }
    } else {
        // User is not logged in - show login link
        if (loginLink) {
            loginLink.href = 'login.html';
            loginLink.textContent = 'Login';
            loginLink.innerHTML = 'Login';
        }
    }
}

// Get logged in user from localStorage
function getLoggedInUser() {
    const userData = localStorage.getItem('loggedInUser');
    return userData ? JSON.parse(userData) : null;
}
