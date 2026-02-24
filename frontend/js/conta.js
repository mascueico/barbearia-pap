// Account page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if user is logged in
    const loggedInUser = getLoggedInUser();
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    // Initialize page
    initializePage();
});

function initializePage() {
    // Load user information
    loadUserProfile();
    
    // Load user bookings
    loadUserBookings();
    
    // Initialize sidebar navigation
    initializeSidebar();
}

// Get logged in user from localStorage
function getLoggedInUser() {
    const userData = localStorage.getItem('loggedInUser');
    return userData ? JSON.parse(userData) : null;
}

// Load user profile information
function loadUserProfile() {
    const loggedInUser = getLoggedInUser();
    
    // Display user information in the sidebar
    document.getElementById('userName').textContent = loggedInUser.nome_cliente;
    document.getElementById('userEmail').textContent = loggedInUser.email;
    
    // Generate user avatar
    const initials = loggedInUser.nome_cliente
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    document.getElementById('userAvatar').innerHTML = initials;
    
    // Display detailed profile information
    const profileInfo = document.getElementById('profileInfo');
    profileInfo.innerHTML = `
        <div class="info-item">
            <div class="info-label">Nome Completo</div>
            <div class="info-value">${loggedInUser.nome_cliente}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Email</div>
            <div class="info-value">${loggedInUser.email}</div>
        </div>
        <div class="info-item">
            <div class="info-label">Telefone</div>
            <div class="info-value">${loggedInUser.telefone || 'Não informado'}</div>
        </div>
    `;
}

// Load user bookings
async function loadUserBookings() {
    const loggedInUser = getLoggedInUser();
    
    try {
        const response = await fetch(`http://localhost:3000/agendamentos?cliente=${loggedInUser.id_cliente}`);
        const bookings = await response.json();
        
        displayBookings(bookings);
    } catch (error) {
        console.error('Erro ao carregar agendamentos:', error);
        const bookingsList = document.getElementById('bookingsList');
        bookingsList.innerHTML = `
            <div class="error">
                <i class="fas fa-exclamation-triangle"></i> Erro ao carregar agendamentos. Tente novamente mais tarde.
            </div>
        `;
    }
}

// Display bookings
function displayBookings(bookings) {
    const bookingsList = document.getElementById('bookingsList');
    
    if (bookings.length === 0) {
        bookingsList.innerHTML = `
            <div class="info-item">
                <div style="text-align: center; color: #666; padding: 3rem;">
                    <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem; color: #ccc;"></i>
                    <p style="font-size: 1.1rem;">Você ainda não tem agendamentos.</p>
                    <p style="margin-top: 0.5rem;">Agende seu primeiro corte <a href="marcar.html" style="color: #667eea; font-weight: 600;">clicando aqui</a>.</p>
                </div>
            </div>
        `;
        return;
    }
    
    const bookingsHtml = bookings.map(booking => `
        <div class="booking-item">
            <div class="booking-header">
                <div class="booking-service">${booking.servico}</div>
                <div class="booking-status status-${booking.status.toLowerCase()}">
                    ${booking.status}
                </div>
            </div>
            <div class="booking-details">
                <div class="booking-detail">
                    <i class="fas fa-calendar"></i>
                    <span>Data: ${new Date(booking.data_agendamento).toLocaleDateString('pt-PT')}</span>
                </div>
                <div class="booking-detail">
                    <i class="fas fa-clock"></i>
                    <span>Hora: ${booking.hora}</span>
                </div>
                <div class="booking-detail">
                    <i class="fas fa-user-tie"></i>
                    <span>Barbeiro: ${booking.funcionario}</span>
                </div>
                ${booking.observacoes ? `
                    <div class="booking-detail">
                        <i class="fas fa-comment"></i>
                        <span>Observações: ${booking.observacoes}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    bookingsList.innerHTML = bookingsHtml;
}

// Initialize sidebar navigation
function initializeSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-menu a[data-section]');
    const sections = document.querySelectorAll('.account-main .section');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            
            // Remove active class from all links and sections
            sidebarLinks.forEach(l => l.classList.remove('active'));
            sections.forEach(s => s.classList.remove('active'));
            
            // Add active class to clicked link and corresponding section
            this.classList.add('active');
            const sectionId = this.getAttribute('data-section');
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.add('active');
            }
        });
    });
}

// Handle logout
function handleLogout(event) {
    event.preventDefault();
    
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('loggedInUser');
        window.location.href = 'login.html';
    }
}

// Add CSS for switch button
const style = document.createElement('style');
style.textContent = `
    .switch {
        position: relative;
        display: inline-block;
        width: 50px;
        height: 24px;
    }
    
    .switch input {
        opacity: 0;
        width: 0;
        height: 0;
    }
    
    .slider {
        position: absolute;
        cursor: pointer;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: #ccc;
        transition: .4s;
        border-radius: 24px;
    }
    
    .slider:before {
        position: absolute;
        content: "";
        height: 18px;
        width: 18px;
        left: 3px;
        bottom: 3px;
        background-color: white;
        transition: .4s;
        border-radius: 50%;
    }
    
    input:checked + .slider {
        background-color: #667eea;
    }
    
    input:focus + .slider {
        box-shadow: 0 0 1px #667eea;
    }
    
    input:checked + .slider:before {
        transform: translateX(26px);
    }
`;
document.head.appendChild(style);
