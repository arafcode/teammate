// API_URL auth.js tarafindan tanimlaniyor
// const API_URL = '/api';
console.log('Main.js loaded and executing...');
window.onerror = function (msg, url, line, col, error) {
    console.error("Global Error:", msg, "\nurl:", url, "\nline:", line, "\ncol:", col, "\nerror:", error);
};

// State
let allListings = [];
let currentCategory = 'virtual'; // 'virtual' or 'real_life'
let currentFilter = null;

// DOM Elements
const listingsContainer = document.getElementById('listings-container');
const toggleIndicator = document.getElementById('toggle-indicator');
const btnVirtual = document.getElementById('btn-virtual');
const btnReal = document.getElementById('btn-real');
const filtersContainer = document.getElementById('filters-container');

// Filter Categories Config
const filterCategories = {
    'virtual': ['League of Legends', 'Valorant', 'CS2', 'Dota 2', 'Minecraft', 'Overwatch 2'],
    'real_life': ['Halı Saha', 'Basketbol', 'Bisiklet', 'Koşu', 'Tenis', 'Doğa Yürüyüşü']
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    renderFilters('virtual'); // Initial render
    fetchListings();
    setupHeaderInteractions();

    // Message Button Interaction (Event Delegation)
    listingsContainer.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            const btn = e.target.closest('button');
            if (btn.textContent.includes('Mesaj At')) {
                alert('Mesajlaşma özelliği yakında eklenecek!');
            }
        }
    });
});

// Fetch Data
async function fetchListings() {
    try {
        const response = await fetch(`${API_URL}/listings`);
        const data = await response.json();

        if (response.ok) {
            allListings = data;
            renderListings();
        } else {
            console.error('İlanlar çekilemedi:', data);
        }
    } catch (error) {
        console.error('Bağlantı hatası:', error);
    }
}

// Render UI
function renderListings() {
    listingsContainer.innerHTML = '';

    let filteredListings = allListings.filter(listing => listing.category_slug === currentCategory);

    // Apply exact text filter if active
    if (currentFilter) {
        filteredListings = filteredListings.filter(listing =>
            listing.title.toLowerCase().includes(currentFilter.toLowerCase()) ||
            listing.description.toLowerCase().includes(currentFilter.toLowerCase())
        );
    }

    if (filteredListings.length === 0) {
        listingsContainer.innerHTML = `
      <div class="text-center py-10 text-slate-500">
        <p>Görüntülenecek ilan bulunamadı.</p>
        ${currentFilter ? `<button onclick="clearFilter()" class="text-blue-600 hover:underline mt-2 text-sm">Filtreyi Temizle</button>` : ''}
      </div>
    `;
        return;
    }

    filteredListings.forEach(listing => {
        const card = createListingCard(listing);
        listingsContainer.innerHTML += card;
    });
}

function clearFilter() {
    currentFilter = null;
    document.querySelectorAll('.overflow-x-auto button').forEach(b => {
        b.classList.remove('bg-slate-900', 'text-white', 'border-transparent');
        b.classList.add('bg-white', 'text-slate-600', 'border-gray-200');
    });
    renderListings();
}

function createListingCard(listing) {
    const isVirtual = listing.category_slug === 'virtual';
    const badgeColor = isVirtual ? 'text-blue-600 bg-blue-50 border-blue-100/50' : 'text-green-600 bg-green-50 border-green-100/50';
    const dateStr = new Date(listing.activity_date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    // XSS Koruması için basit kaçış (Prototype için)
    const safeTitle = escapeHtml(listing.title);
    const safeDesc = escapeHtml(listing.description);
    const safeUsername = escapeHtml(listing.username);

    return `
    <div class="group bg-white rounded-2xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md hover:border-gray-300/80 transition-all duration-300 cursor-pointer">
        <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
                <img src="${listing.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + listing.username}" alt="User" class="w-10 h-10 rounded-full bg-gray-50 border border-gray-100">
                <div>
                    <h3 class="font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">${safeTitle}</h3>
                    <p class="text-xs text-slate-500 mt-0.5">@${safeUsername}</p>
                </div>
            </div>
            <span class="px-2.5 py-1 rounded-full ${badgeColor} text-xs font-semibold border">${listing.category_name}</span>
        </div>
        
        <p class="text-sm text-slate-600 leading-relaxed mb-4">
            ${safeDesc}
        </p>

        <div class="flex items-center justify-between pt-4 border-t border-gray-50">
            <div class="flex items-center gap-4 text-xs font-medium text-slate-500">
                ${listing.location ? `
                <span class="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-md">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${escapeHtml(listing.location)}
                </span>
                ` : ''}
                <span class="flex items-center gap-1.5 text-orange-600 bg-orange-50 px-2 py-1 rounded-md">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${getRemainingTime(listing.expiry_date)}
                </span>
                <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    ${listing.max_participants} Kişi
                </span>
            </div>
            
            <button data-email="${listing.email}" data-title="${safeTitle}" 
                class="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-1">
                Mesaj At
                <svg class="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </button>
        </div>
    </div>
  `;
}

// Helpers
function switchTab(type) {
    console.log('Switching tab to:', type);
    currentCategory = type === 'real' ? 'real_life' : 'virtual';

    if (!btnVirtual || !btnReal || !toggleIndicator) {
        console.error('UI elementleri bulunamadı!');
        return;
    }

    // Determine active button
    const activeBtn = type === 'virtual' ? btnVirtual : btnReal;
    const inactiveBtn = type === 'virtual' ? btnReal : btnVirtual;

    // Calculate position relative to container
    // The parent has horizontal padding (p-1 which is 4px)
    // We want the indicator to match the active button's dimensions and position
    toggleIndicator.style.width = `${activeBtn.offsetWidth}px`;
    toggleIndicator.style.height = `${activeBtn.offsetHeight}px`;

    // Move the indicator to the button's position
    // Since indicator is absolute top-1 left-1, we need to adjust transform.
    // However, simplest way is to match offsetLeft of the button relative to parent.
    // But both are children of the same parent. 
    // Initial left is 4px (left-1).
    // Button left is activeBtn.offsetLeft.
    // Transform X = dest - start.
    // Start X = 4px.
    const currentLeft = activeBtn.offsetLeft;
    toggleIndicator.style.transform = `translateX(${currentLeft - 4}px)`;

    // Update text colors
    // Reset both first to ensure clean state
    activeBtn.classList.remove('text-slate-500');
    activeBtn.classList.add('text-slate-900');

    inactiveBtn.classList.remove('text-slate-900');
    inactiveBtn.classList.add('text-slate-500');

    // Update filters based on new category
    renderFilters(type);

    renderListings();
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function timeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " yıl önce";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " ay önce";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " gün önce";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " saat önce";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " dk önce";
    return "Az önce";
}

function getRemainingTime(expiryDateStr) {
    let expiry;
    if (typeof expiryDateStr === 'string' && !expiryDateStr.endsWith('Z')) {
        expiry = new Date(expiryDateStr + 'Z'); // Treat as UTC
    } else {
        expiry = new Date(expiryDateStr);
    }

    const now = new Date();
    const diffMs = expiry - now;

    if (diffMs <= 0) return "Süresi Doldu";

    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHrs > 24) {
        const days = Math.floor(diffHrs / 24);
        return `${days} gün kaldı`;
    }

    if (diffHrs > 0) {
        return `${diffHrs} sa ${diffMins} dk kaldı`;
    }

    return `${diffMins} dk kaldı`;
}

function renderFilters(categoryType) {
    // Determine key for config
    const key = categoryType === 'real' ? 'real_life' : 'virtual';
    const filters = filterCategories[key] || [];

    // Clear existing
    filtersContainer.innerHTML = '';
    currentFilter = null; // Reset selection on tab switch

    filters.forEach(filterName => {
        const btn = document.createElement('button');
        btn.className = 'px-3 py-1.5 bg-white border border-gray-200 rounded-full text-xs font-medium text-slate-600 shadow-sm hover:border-gray-300 transition-colors whitespace-nowrap';
        btn.textContent = filterName;

        btn.addEventListener('click', function () {
            const filterText = this.textContent.trim();
            const allButtons = filtersContainer.querySelectorAll('button');

            if (currentFilter === filterText) {
                currentFilter = null;
                this.classList.remove('bg-slate-900', 'text-white', 'border-transparent');
                this.classList.add('bg-white', 'text-slate-600', 'border-gray-200');
            } else {
                currentFilter = filterText;
                allButtons.forEach(b => {
                    b.classList.remove('bg-slate-900', 'text-white', 'border-transparent');
                    b.classList.add('bg-white', 'text-slate-600', 'border-gray-200');
                });
                this.classList.remove('bg-white', 'text-slate-600', 'border-gray-200');
                this.classList.add('bg-slate-900', 'text-white', 'border-transparent');
            }
            renderListings();
        });

        filtersContainer.appendChild(btn);
    });

    // Add horizontal scroll wrapper look (optional padding)
    filtersContainer.className = 'flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide';
}

function setupHeaderInteractions() {
    if (typeof Auth === 'undefined') {
        console.error('Auth module not loaded!');
        return;
    }
    const btnLogin = document.getElementById('btn-login');
    const btnCreate = document.getElementById('btn-create-listing');
    const user = Auth.getUser();

    // UI Update based on Auth
    if (Auth.isAuthenticated() && user) {
        // Change Login button to Profile/Logout
        if (btnLogin) {
            btnLogin.innerHTML = `<span class="text-blue-600 font-semibold">@${user.username}</span>`;
            btnLogin.onclick = (e) => {
                e.preventDefault();
                if (confirm('Çıkış yapılsın mı?')) {
                    Auth.logout();
                }
            };
        }
    } else {
        // Reset to default
        if (btnLogin) {
            btnLogin.textContent = 'Giriş Yap';
            btnLogin.onclick = () => window.location.href = 'login.html';
        }
    }

    // Message Button Interaction (Event Delegation)
    listingsContainer.addEventListener('click', (e) => {
        if (e.target.closest('button')) {
            const btn = e.target.closest('button');
            if (btn.textContent.includes('Mesaj At')) {
                if (!Auth.isAuthenticated()) {
                    window.location.href = 'login.html';
                    return;
                }

                const email = btn.dataset.email;
                const title = btn.dataset.title;

                if (email) {
                    window.location.href = `mailto:${email}?subject=Teammate İlanı: ${title}&body=Merhaba, ilanını gördüm...`;
                } else {
                    alert('Kullanıcı e-postası bulunamadı.');
                }
            }
        }
    });

    // Header Buttons Interaction
    document.getElementById('nav-discover')?.addEventListener('click', (e) => {
        e.preventDefault();
        fetchListings();
    });

    document.getElementById('nav-my-listings')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        alert('İlanlarım sayfası yapım aşamasında.');
    });

    document.getElementById('nav-messages')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (!Auth.isAuthenticated()) {
            window.location.href = 'login.html';
            return;
        }
        alert('Mesaj kutusu yapım aşamasında.');
    });

    // Create Listing Button
    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            if (!Auth.isAuthenticated()) {
                window.location.href = 'login.html?redirect=create-listing.html';
                return;
            }
            window.location.href = 'create-listing.html';
        });
    }
}

// Global scope'a fonksiyonu ata (onclick için)
window.switchTab = switchTab;
window.clearFilter = clearFilter;
