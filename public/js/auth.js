const API_URL = '/api';
window.API_URL = API_URL;

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorDiv = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            showError(null); // Clear previous errors

            try {
                const response = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok) {
                    Auth.login(data.token, data.user);
                } else {
                    showError(data.message || 'Giriş yapılamadı.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Bir bağlantı hatası oluştu.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const city = document.getElementById('city').value;
            const gender = document.getElementById('gender').value;
            const birth_date = document.getElementById('birth_date').value;

            showError(null);

            try {
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password, city, gender, birth_date })
                });

                const data = await response.json();

                if (response.ok) {
                    Auth.login(data.token, data.user);
                } else {
                    showError(data.message || 'Kayıt olunamadı.');
                }
            } catch (error) {
                console.error('Register error:', error);
                showError('Bir bağlantı hatası oluştu.');
            }
        });
    }

    function showError(msg) {
        if (!errorDiv) return;
        if (msg) {
            errorDiv.textContent = msg;
            errorDiv.classList.remove('hidden');
        } else {
            errorDiv.classList.add('hidden');
        }
    }
});

// Auth Helper
const Auth = {
    login: (token, user) => {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        window.location.href = 'index.html';
    },
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.reload();
    },
    getToken: () => localStorage.getItem('token'),
    getUser: () => JSON.parse(localStorage.getItem('user')),
    isAuthenticated: () => !!localStorage.getItem('token')
};

// Make Auth global for other scripts
window.Auth = Auth;
