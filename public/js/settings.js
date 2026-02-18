// Settings Page Logic
// API_URL is defined by auth.js (loaded before this script)

let currentSettings = null;

document.addEventListener('DOMContentLoaded', async () => {
    const user = Auth.getUser();
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    await loadSettings();
});

// Navigation
function showSection(name) {
    document.querySelectorAll('.settings-section').forEach(s => s.classList.add('hidden'));
    document.querySelectorAll('.settings-nav-item').forEach(b => {
        b.classList.remove('active');
        if (!b.closest('.border-t')) b.classList.add('text-gray-400');
    });

    document.getElementById(`section-${name}`).classList.remove('hidden');
    const btn = document.querySelector(`[data-section="${name}"]`);
    if (btn) {
        btn.classList.add('active');
        btn.classList.remove('text-gray-400');
    }
}

// Toggle Switch
function toggleSwitch(el) {
    el.classList.toggle('active');
}

// Load Settings
async function loadSettings() {
    try {
        const resp = await fetch(`${API_URL}/settings`, {
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.status === 401) {
            Auth.logout();
            return;
        }
        const data = await resp.json();
        currentSettings = data;

        // Fill account fields
        document.getElementById('set-username').value = data.user.username || '';
        document.getElementById('set-email').value = data.user.email || '';

        const date = new Date(data.user.created_at);
        document.getElementById('set-created').textContent = date.toLocaleDateString('tr-TR', {
            year: 'numeric', month: 'long', day: 'numeric'
        });

        // Fill notification toggles
        setToggle('toggle-notify-messages', data.settings.notify_messages);
        setToggle('toggle-notify-comments', data.settings.notify_comments);
        setToggle('toggle-notify-listings', data.settings.notify_listings);

        // Fill privacy toggles
        setToggle('toggle-privacy-public', data.settings.privacy_profile_public);
        setToggle('toggle-privacy-online', data.settings.privacy_show_online);
        setToggle('toggle-privacy-city', data.settings.privacy_show_city);
        setToggle('toggle-privacy-interests', data.settings.privacy_show_interests);

    } catch (e) {
        console.error('Settings load failed:', e);
        showToast('Ayarlar yüklenemedi.', 'error');
    }
}

function setToggle(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    if (value) {
        el.classList.add('active');
    } else {
        el.classList.remove('active');
    }
}

function isToggleOn(id) {
    const el = document.getElementById(id);
    return el ? el.classList.contains('active') : true;
}

// Save Account Info
async function saveAccount() {
    const username = document.getElementById('set-username').value.trim();
    const email = document.getElementById('set-email').value.trim();

    if (!username || !email) return showToast('Kullanıcı adı ve e-posta zorunludur.', 'error');

    try {
        const resp = await fetch(`${API_URL}/settings/account`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ username, email })
        });
        const data = await resp.json();

        if (resp.ok) {
            showToast('Hesap bilgileri güncellendi.', 'success');
            // Update localStorage user info
            const user = Auth.getUser();
            if (user) {
                user.username = username;
                user.email = email;
                localStorage.setItem('user', JSON.stringify(user));
            }
        } else {
            showToast(data.message || 'Güncelleme başarısız.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// Change Password
async function changePassword() {
    const current = document.getElementById('set-current-password').value;
    const newPass = document.getElementById('set-new-password').value;
    const confirm = document.getElementById('set-confirm-password').value;

    if (!current || !newPass) return showToast('Tüm alanları doldurun.', 'error');
    if (newPass.length < 6) return showToast('Yeni şifre en az 6 karakter olmalı.', 'error');
    if (newPass !== confirm) return showToast('Yeni şifreler eşleşmiyor.', 'error');

    try {
        const resp = await fetch(`${API_URL}/settings/password`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ current_password: current, new_password: newPass })
        });
        const data = await resp.json();

        if (resp.ok) {
            showToast('Şifre başarıyla değiştirildi.', 'success');
            document.getElementById('set-current-password').value = '';
            document.getElementById('set-new-password').value = '';
            document.getElementById('set-confirm-password').value = '';
        } else {
            showToast(data.message || 'Şifre değiştirilemedi.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// Save Notification Settings
async function saveNotifications() {
    try {
        const resp = await fetch(`${API_URL}/settings/notifications`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                notify_messages: isToggleOn('toggle-notify-messages'),
                notify_comments: isToggleOn('toggle-notify-comments'),
                notify_listings: isToggleOn('toggle-notify-listings')
            })
        });
        if (resp.ok) {
            showToast('Bildirim ayarları kaydedildi.', 'success');
        } else {
            showToast('Kaydetme başarısız.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// Save Privacy Settings
async function savePrivacy() {
    try {
        const resp = await fetch(`${API_URL}/settings/privacy`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                privacy_profile_public: isToggleOn('toggle-privacy-public'),
                privacy_show_online: isToggleOn('toggle-privacy-online'),
                privacy_show_city: isToggleOn('toggle-privacy-city'),
                privacy_show_interests: isToggleOn('toggle-privacy-interests')
            })
        });
        if (resp.ok) {
            showToast('Gizlilik ayarları kaydedildi.', 'success');
        } else {
            showToast('Kaydetme başarısız.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// Delete Account
async function deleteAccount() {
    const password = document.getElementById('set-delete-password').value;
    if (!password) return showToast('Şifrenizi girin.', 'error');

    if (!confirm('Hesabınızı kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
        const resp = await fetch(`${API_URL}/settings/account`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ password })
        });
        const data = await resp.json();

        if (resp.ok) {
            showToast('Hesabınız silindi. Yönlendiriliyorsunuz...', 'success');
            setTimeout(() => {
                Auth.logout();
            }, 2000);
        } else {
            showToast(data.message || 'Hesap silinemedi.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');

    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-[#252525]';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';

    toast.className = `${bgColor} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `<span class="text-lg">${icon}</span> ${message}`;

    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-x-full'));

    setTimeout(() => {
        toast.classList.add('translate-x-full');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
