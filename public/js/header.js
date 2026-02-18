console.log('Header.js loaded');

document.addEventListener('DOMContentLoaded', () => {
    setupHeaderInteractions();
});

function setupHeaderInteractions() {
    if (typeof Auth === 'undefined') {
        console.error('Auth module not loaded!');
        return;
    }
    const btnLogin = document.getElementById('btn-login');
    const btnCreate = document.getElementById('btn-create-listing');
    const btnRegister = document.getElementById('btn-register');

    const user = Auth.getUser();

    // UI Update based on Auth
    if (Auth.isAuthenticated() && user) {
        // Change Login button to Profile Dropdown
        if (btnLogin) {
            const avatarUrl = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            const dropdownHTML = `
                <div class="relative" id="user-menu-container">
                    <button id="user-menu-btn" class="flex items-center gap-2 focus:outline-none hover:bg-white/5 p-1.5 rounded-lg transition-colors">
                        <img src="${avatarUrl}" alt="Profile" class="w-8 h-8 rounded-full bg-[#202020] border border-gray-700">
                        <span class="text-white font-semibold text-sm hidden sm:block">${user.username}</span>
                        <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                    </button>

                    <!-- Dropdown Menu -->
                    <div id="user-dropdown" class="hidden absolute right-0 mt-2 w-48 bg-[#252525] border border-gray-700 rounded-xl shadow-xl py-2 z-50 transform origin-top-right transition-all">
                        <div class="px-4 py-3 border-b border-gray-700 mb-1">
                            <p class="text-sm text-white font-bold truncate">${user.username}</p>
                            <p class="text-xs text-gray-400 truncate">${user.email}</p>
                        </div>
                        <a href="profile.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                             <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                             Profilim
                        </a>
                        <a href="settings.html" class="block px-4 py-2 text-sm text-gray-300 hover:bg-white/5 hover:text-white transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                            Ayarlar
                        </a>
                        <div class="border-t border-gray-700 my-1"></div>
                        <a href="#" id="logout-btn" class="block px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                            Çıkış Yap
                        </a>
                    </div>
                </div>
            `;

            btnLogin.outerHTML = dropdownHTML;

            // Re-select elements after injection
            const menuBtn = document.getElementById('user-menu-btn');
            const dropdown = document.getElementById('user-dropdown');
            const logoutBtn = document.getElementById('logout-btn');

            // Toggle Dropdown
            if (menuBtn && dropdown) {
                menuBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    dropdown.classList.toggle('hidden');
                });
                document.addEventListener('click', (e) => {
                    if (!dropdown.contains(e.target) && !menuBtn.contains(e.target)) {
                        dropdown.classList.add('hidden');
                    }
                });
            }

            // Logout Handler
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Çıkış yapılsın mı?')) {
                        Auth.logout();
                        // showToast is global or we use alert if not available
                        if (window.showToast) showToast('Çıkış yapıldı', 'success');
                    }
                });
            }
        }
        if (btnRegister) {
            btnRegister.style.display = 'none';
        }
    } else {
        if (btnLogin) {
            btnLogin.textContent = 'Giriş Yap';
            btnLogin.onclick = () => window.location.href = 'login.html';
        }
    }

    // Header Buttons Interaction
    document.getElementById('nav-discover')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (typeof fetchListings === 'function') {
            fetchListings();
        } else {
            window.location.href = 'home.html#listings-section';
        }
    });

    // Create Listing Button — open modal popup
    if (btnCreate) {
        // Inject the modal HTML into the page
        injectCreateListingModal();

        btnCreate.addEventListener('click', () => {
            if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
                window.location.href = 'login.html';
                return;
            }
            document.getElementById('create-listing-modal').classList.remove('hidden');
        });
    }

    // AUTH ACTIONS (Messages & Notifications)
    const authActions = document.getElementById('auth-actions');
    if (Auth.isAuthenticated()) {
        if (authActions) authActions.classList.remove('hidden');
        startNotificationPolling();
        loadChatWidget();
    }
}

function loadChatWidget() {
    if (document.getElementById('chat-widget-script')) return;
    console.log('Loading chat widget...');
    const script = document.createElement('script');
    script.id = 'chat-widget-script';
    script.src = `js/chat-widget.js?v=${Date.now()}`; // Force reload
    script.onload = () => console.log('Chat widget script loaded');
    script.onerror = (e) => console.error('Chat widget script failed to load', e);
    document.body.appendChild(script);
}


// Notification Logic
let notifDropdownOpen = false;
let notifications = [];

document.getElementById('btn-notifications')?.addEventListener('click', (e) => {
    e.stopPropagation();
    const dropdown = document.getElementById('notification-dropdown');
    notifDropdownOpen = !notifDropdownOpen;
    if (notifDropdownOpen) {
        dropdown.classList.remove('hidden');
        renderNotifications(); // Re-render to ensure freshness
    } else {
        dropdown.classList.add('hidden');
    }
});

document.addEventListener('click', (e) => {
    const dropdown = document.getElementById('notification-dropdown');
    const btn = document.getElementById('btn-notifications');
    if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
        dropdown.classList.add('hidden');
        notifDropdownOpen = false;
    }
});

async function startNotificationPolling() {
    fetchNotifications();
    setInterval(fetchNotifications, 60000); // Poll every 60s (was 15s)
}

async function fetchNotifications() {
    try {
        const token = Auth.getToken();
        if (!token) return;

        // Note: API_URL needs to be defined. It is usually in auth.js or main.js
        // If auth.js runs first, it might not define it globally?
        // auth.js says `const API_URL = '/api';` but if it's not window.API_URL it might be scoped.
        // Let's assume '/api' is safe to use directly or check window.API_URL
        const apiUrl = window.API_URL || '/api';

        const response = await fetch(`${apiUrl}/messages?type=conversations`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const data = await response.json();
            // Filter unread messages that are NOT from me
            const myId = Auth.getUser().id;
            const unread = data.filter(c => !c.is_read && c.sender_id !== myId);

            notifications = unread;
            updateNotificationUI();
        }
    } catch (e) {
        console.error('Notification poll error:', e);
    }
}

function updateNotificationUI() {
    const msgBadge = document.getElementById('nav-msg-badge');
    const notifBadge = document.getElementById('nav-notif-badge');
    const count = notifications.length;

    if (count > 0) {
        if (msgBadge) msgBadge.classList.remove('hidden');
        if (notifBadge) notifBadge.classList.remove('hidden');
    } else {
        if (msgBadge) msgBadge.classList.add('hidden');
        if (notifBadge) notifBadge.classList.add('hidden');
    }

    if (notifDropdownOpen) renderNotifications();
}

function renderNotifications() {
    const list = document.getElementById('notification-list');
    if (!list) return;

    list.innerHTML = '';

    if (notifications.length === 0) {
        list.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">Yeni bildirim yok</div>';
        return;
    }

    notifications.forEach(notif => {
        const div = document.createElement('a');
        div.href = 'messages.html'; // Go to messages
        div.className = 'block p-3 hover:bg-[#333] transition-colors border-b border-gray-700';
        div.innerHTML = `
            <p class="text-sm font-bold text-white">${escapeHtmlHeader(notif.other_user_name)}</p>
            <p class="text-xs text-blue-400 mb-0.5">${escapeHtmlHeader(notif.listing_title)}</p>
            <p class="text-xs text-gray-400 truncate">${escapeHtmlHeader(notif.content)}</p>
        `;
        list.appendChild(div);
    });
}

// ===================== CREATE LISTING MODAL =====================

function injectCreateListingModal() {
    if (document.getElementById('create-listing-modal')) return; // already injected

    const modalHTML = `
    <div id="create-listing-modal" class="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] hidden flex items-center justify-center p-4" onclick="if(event.target===this)closeListingModal()">
        <div class="bg-[#1e1e1e] rounded-2xl w-full max-w-lg border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto" style="backdrop-filter:blur(10px)">
            <div class="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 class="text-xl font-bold text-white">İlan Oluştur</h2>
                <button onclick="closeListingModal()" class="text-gray-400 hover:text-white transition-colors p-1">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            <div class="p-5 space-y-4">
                <!-- Category -->
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-2">Kategori *</label>
                    <div class="grid grid-cols-2 gap-3">
                        <label class="cursor-pointer">
                            <input type="radio" name="modal_category" value="virtual" checked class="hidden peer" onchange="updateModalSubcategories()">
                            <div class="peer-checked:border-purple-500 peer-checked:bg-purple-500/10 border border-gray-700 rounded-xl p-3 text-center transition-all hover:border-gray-500">
                                <div class="text-2xl mb-1">🎮</div>
                                <div class="text-sm font-medium text-white">Sanal</div>
                                <div class="text-xs text-gray-500">Oyunlar</div>
                            </div>
                        </label>
                        <label class="cursor-pointer">
                            <input type="radio" name="modal_category" value="real_life" class="hidden peer" onchange="updateModalSubcategories()">
                            <div class="peer-checked:border-green-500 peer-checked:bg-green-500/10 border border-gray-700 rounded-xl p-3 text-center transition-all hover:border-gray-500">
                                <div class="text-2xl mb-1">⚽</div>
                                <div class="text-sm font-medium text-white">Gerçek Hayat</div>
                                <div class="text-xs text-gray-500">Spor & Aktivite</div>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- Subcategory -->
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Alt Kategori *</label>
                    <select id="modal-subcategory" class="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none"></select>
                </div>

                <!-- Title -->
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Başlık *</label>
                    <input type="text" id="modal-listing-title" class="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none" placeholder="Valorant Ranked Duo Arıyorum">
                </div>

                <!-- Description -->
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Açıklama</label>
                    <textarea id="modal-listing-desc" rows="3" class="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none resize-none" placeholder="İlan detaylarını yaz..."></textarea>
                </div>

                <!-- Duration -->
                <div>
                    <label class="block text-sm font-medium text-gray-400 mb-1">Süre (dakika) *</label>
                    <select id="modal-listing-duration" class="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none">
                        <option value="30">30 dakika</option>
                        <option value="60" selected>1 saat</option>
                        <option value="90">1.5 saat</option>
                        <option value="120">2 saat</option>
                        <option value="180">3 saat</option>
                    </select>
                </div>

                <!-- Location (hidden for virtual) -->
                <div id="modal-location-field" class="hidden">
                    <label class="block text-sm font-medium text-gray-400 mb-1">Konum *</label>
                    <input type="text" id="modal-listing-location" class="w-full bg-[#0f0f0f] border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-white/30 focus:outline-none" placeholder="İstanbul, Kadıköy">
                </div>

                <!-- Submit -->
                <button id="modal-listing-submit" onclick="submitListingModal()" class="w-full bg-white hover:bg-gray-200 text-black py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-lg shadow-white/10">
                    İlanı Yayınla
                </button>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);

    // Initialize subcategories
    setTimeout(() => updateModalSubcategories(), 0);
}

const _modalSubcats = {
    'virtual': ['League of Legends', 'Valorant', 'CS2', 'Dota 2', 'Minecraft', 'Overwatch 2', 'Deadlock', 'Diğer'],
    'real_life': ['Halı Saha', 'Basketbol', 'Bisiklet', 'Koşu', 'Tenis', 'Doğa Yürüyüşü', 'Kamp', 'Diğer']
};

window.updateModalSubcategories = function () {
    const sel = document.querySelector('input[name="modal_category"]:checked');
    if (!sel) return;
    const cat = sel.value;
    const select = document.getElementById('modal-subcategory');
    if (select) {
        select.innerHTML = (_modalSubcats[cat] || []).map(o => `<option value="${o}">${o}</option>`).join('');
    }
    const locField = document.getElementById('modal-location-field');
    if (locField) {
        if (cat === 'real_life') locField.classList.remove('hidden');
        else locField.classList.add('hidden');
    }
};

window.closeListingModal = function () {
    const modal = document.getElementById('create-listing-modal');
    if (modal) modal.classList.add('hidden');
};

window.submitListingModal = async function () {
    const category_slug = document.querySelector('input[name="modal_category"]:checked')?.value || 'virtual';
    const subcategory = document.getElementById('modal-subcategory')?.value;
    const title = document.getElementById('modal-listing-title')?.value?.trim();
    const description = document.getElementById('modal-listing-desc')?.value?.trim() || '';
    const duration = document.getElementById('modal-listing-duration')?.value || '60';
    const location = document.getElementById('modal-listing-location')?.value?.trim() || '';

    if (!title) {
        showToastHeader('Başlık zorunlu.', 'error');
        return;
    }
    if (category_slug === 'real_life' && !location) {
        showToastHeader('Konum zorunlu.', 'error');
        return;
    }

    const submitBtn = document.getElementById('modal-listing-submit');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Yayınlanıyor...'; }

    try {
        const apiUrl = window.API_URL || '/api';
        const resp = await fetch(`${apiUrl}/listings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                category_slug,
                subcategory,
                title,
                description,
                duration_minutes: parseInt(duration),
                activity_date: new Date().toISOString(),
                location
            })
        });

        const result = await resp.json();

        if (resp.ok) {
            showToastHeader('İlan başarıyla oluşturuldu!', 'success');
            closeListingModal();
            // Reset form
            document.getElementById('modal-listing-title').value = '';
            document.getElementById('modal-listing-desc').value = '';
            document.getElementById('modal-listing-location').value = '';
            // Refresh listings if we're on home page
            if (typeof fetchListings === 'function') setTimeout(() => fetchListings(), 500);
        } else {
            showToastHeader(result.message || 'İlan oluşturulamadı.', 'error');
        }
    } catch (e) {
        showToastHeader('Bir hata oluştu.', 'error');
    } finally {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'İlanı Yayınla'; }
    }
};

function showToastHeader(message, type = 'info') {
    // Find or create container
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'fixed top-24 right-4 z-[100] flex flex-col gap-3';
        document.body.appendChild(container);
    }
    const t = document.createElement('div');
    const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-[#252525]';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    t.className = `${bg} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transform translate-x-full transition-transform duration-300`;
    t.innerHTML = `<span class="text-lg">${icon}</span> ${message}`;
    container.appendChild(t);
    requestAnimationFrame(() => t.classList.remove('translate-x-full'));
    setTimeout(() => { t.classList.add('translate-x-full'); setTimeout(() => t.remove(), 300); }, 3000);
}

function escapeHtmlHeader(text) {
    if (!text) return '';
    if (typeof text !== 'string') return String(text);
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
