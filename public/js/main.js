// API_URL auth.js tarafindan tanimlaniyor
// const API_URL = '/api';
console.log('Main.js loaded and executing...');
window.onerror = function (msg, url, line, col, error) {
    console.error("Global Error:", msg, "\nurl:", url, "\nline:", line, "\ncol:", col, "\nerror:", error);
    // alert("Global Error: " + msg); // Uncomment for aggressive debugging
};

// Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icons based on type
    let icon = '';
    if (type === 'success') icon = '<svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    else if (type === 'error') icon = '<svg class="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    else icon = '<svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

    toast.innerHTML = `${icon}<span>${message}</span>`;

    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.classList.add('hiding');
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// Global scope
window.showToast = showToast;

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
    'virtual': ['League of Legends', 'Valorant', 'CS2', 'Dota 2', 'Minecraft', 'Overwatch 2', 'Deadlock', 'Diğer'],
    'real_life': ['Halı Saha', 'Basketbol', 'Bisiklet', 'Koşu', 'Tenis', 'Doğa Yürüyüşü', 'Kamp', 'Diğer']
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Loaded');

    // Protect home.html
    const path = window.location.pathname;
    if (path.endsWith('home.html') && typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    // Header Logo Click Handling
    const logoLink = document.querySelector('.group.cursor-pointer');
    if (logoLink) {
        logoLink.onclick = () => {
            if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
                window.location.href = 'home.html';
            } else {
                window.location.href = 'index.html';
            }
        };
    }

    renderFilters('virtual'); // Initial render
    fetchListings();
});

// Fetch Data
async function fetchListings() {
    try {
        console.log('Fetching listings...');
        const response = await fetch(`${API_URL}/listings`);
        const data = await response.json();

        console.log('Fetch response status:', response.status);
        console.log('Fetch data length:', Array.isArray(data) ? data.length : 'Not Array');

        if (response.ok) {
            allListings = data;
            if (allListings.length > 0) {
                console.log('First listing sample:', allListings[0]);
            }
            renderListings();
        } else {
            console.error('İlanlar çekilemedi:', data);
            showToast('İlanlar yüklenemedi.', 'error');
        }
    } catch (error) {
        console.error('Bağlantı hatası:', error);
        showToast('Sunucu ile bağlantı kurulamadı.', 'error');
    }
}

// Render UI
function renderListings() {
    try {
        if (!listingsContainer) {
            console.error('Listings container not found!');
            return;
        }

        listingsContainer.innerHTML = '';

        console.log('Rendering listings...', allListings.length);
        console.log('Current Category:', currentCategory);

        let filteredListings = allListings.filter(listing => {
            // Robust check for missing category_slug
            if (!listing.category_slug) {
                console.warn('Listing missing category_slug:', listing.id);
                return false;
            }
            // Comparison
            const match = listing.category_slug === currentCategory;
            // console.log(`Listing ${listing.id} (${listing.category_slug}) match ${currentCategory}? ${match}`);
            return match;
        });
        console.log('Filtered count:', filteredListings.length);

        // Apply exact text filter if active
        if (currentFilter) {
            filteredListings = filteredListings.filter(listing =>
                (listing.title && listing.title.toLowerCase().includes(currentFilter.toLowerCase())) ||
                (listing.description && listing.description.toLowerCase().includes(currentFilter.toLowerCase()))
            );
        }

        if (filteredListings.length === 0) {
            listingsContainer.innerHTML = `
        <div class="text-center py-10 text-slate-500">
            <p>Bu kategoride görüntülenecek ilan bulunamadı.</p>
            ${currentFilter ? `<button onclick="clearFilter()" class="text-blue-600 hover:underline mt-2 text-sm">Filtreyi Temizle</button>` : ''}
        </div>
        `;
            return;
        }

        filteredListings.forEach(listing => {
            const card = createListingCard(listing);
            listingsContainer.innerHTML += card;
        });
    } catch (e) {
        console.error('Render error:', e);
        // alert('Render Error: ' + e.message);
    }
}

function clearFilter() {
    currentFilter = null;
    document.querySelectorAll('.overflow-x-auto button').forEach(b => {
        b.classList.remove('bg-white', 'text-black', 'border-white');
        b.classList.add('bg-transparent', 'text-gray-300', 'border-gray-600');
    });
    renderListings();
}

function createListingCard(listing) {
    const isVirtual = listing.category_slug === 'virtual';
    const badgeColor = isVirtual ? 'text-blue-300 bg-blue-500/10 border-blue-500/20' : 'text-green-300 bg-green-500/10 border-green-500/20';

    // Use subcategory if available, otherwise category_name
    const displayCategory = listing.subcategory || listing.category_name || 'Genel';

    // Time calculations
    const publishedTime = timeAgo(listing.created_at); // timeAgo uses parseDate internally now
    const remainingTime = getRemainingTime(listing.expiry_date);

    // XSS Koruması için basit kaçış (Prototype için)
    const safeTitle = escapeHtml(listing.title);
    const safeDesc = escapeHtml(listing.description);
    const safeUsername = escapeHtml(listing.username);
    const safeCategory = escapeHtml(displayCategory);

    return `
    <div class="group bg-[#2A2A2A] rounded-2xl p-5 border border-gray-700 shadow-sm hover:shadow-md hover:border-gray-500 hover:bg-[#303030] transition-all duration-300 cursor-pointer">
        <div class="flex justify-between items-start mb-3">
            <div class="flex items-center gap-3">
                <img src="${listing.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + listing.username}" alt="User" class="w-10 h-10 rounded-full bg-[#202020] border border-gray-700">
                <div>
                    <h3 class="font-semibold text-white leading-tight group-hover:text-blue-400 transition-colors">${safeTitle}</h3>
                    <p class="text-xs text-gray-400 mt-0.5">@${safeUsername} • ${publishedTime}</p>
                </div>
            </div>
            <span class="px-2.5 py-1 rounded-full ${badgeColor} text-xs font-semibold border">${safeCategory}</span>
        </div>
        
        <p class="text-sm text-gray-400 leading-relaxed mb-4">
            ${safeDesc}
        </p>

        <div class="flex items-center justify-between pt-4 border-t border-gray-700">
            <div class="flex items-center gap-4 text-xs font-medium text-gray-500">
                ${listing.location ? `
                <span class="flex items-center gap-1.5 bg-[#333] px-2 py-1 rounded-md">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                    ${escapeHtml(listing.location)}
                </span>
                ` : ''}
                <span class="flex items-center gap-1.5 text-orange-300 bg-orange-500/10 border border-orange-500/20 px-2 py-1 rounded-md">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${remainingTime}
                </span>
                <span class="flex items-center gap-1.5">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                    ${listing.max_participants} Kişi
                </span>
            </div>
            
            <button onclick="openMessageModal(${listing.user_id}, '${safeUsername}', ${listing.id}, '${safeTitle.replace(/'/g, "\\'")}')"
                class="text-sm font-medium text-white group-hover:text-blue-400 transition-colors flex items-center gap-1">
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

    // Calculate position
    const currentLeft = activeBtn.offsetLeft;
    toggleIndicator.style.width = `${activeBtn.offsetWidth}px`;
    toggleIndicator.style.height = `${activeBtn.offsetHeight}px`;
    toggleIndicator.style.transform = `translateX(${currentLeft - 4}px)`;

    // Update text colors
    activeBtn.classList.remove('text-gray-400');
    activeBtn.classList.add('text-white');

    inactiveBtn.classList.remove('text-white');
    inactiveBtn.classList.add('text-gray-400');

    // Update filters based on new category
    renderFilters(type);

    renderListings();
}

function escapeHtml(text) {
    if (!text) return '';
    if (typeof text !== 'string') return String(text);
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function parseDate(dateStr) {
    if (!dateStr) return new Date();
    // If it's already a Date object
    if (dateStr instanceof Date) return dateStr;

    // If it looks like MySQL format "YYYY-MM-DD HH:MM:SS" (which we act as UTC)
    if (typeof dateStr === 'string') {
        const original = dateStr;
        let parsed;
        // "2024-02-16 15:30:00" -> "2024-02-16T15:30:00Z"
        if (dateStr.includes(' ') && !dateStr.includes('T')) {
            parsed = new Date(dateStr.replace(' ', 'T') + 'Z');
        }
        // ISO string without Z
        else if (!dateStr.endsWith('Z') && dateStr.includes('T')) {
            parsed = new Date(dateStr + 'Z');
        } else {
            parsed = new Date(dateStr);
        }
        // console.log(`ParseDate: '${original}' -> ${parsed.toISOString()}`); // Uncomment for debugging
        return parsed;
    }
}

function timeAgo(dateInput) {
    try {
        const date = parseDate(dateInput);
        if (isNaN(date.getTime())) return "Az önce";

        const seconds = Math.floor((new Date() - date) / 1000);

        // Future protection
        if (seconds < 60) return "Az önce";

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
    } catch (e) {
        console.error('TimeAgo Error:', e);
        return "Bilinmiyor";
    }
}

function getRemainingTime(expiryDateStr) {
    try {
        const expiry = parseDate(expiryDateStr);
        if (isNaN(expiry.getTime())) return "Süresiz";

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
    } catch (e) {
        return "Bilinmiyor";
    }
}

function renderFilters(categoryType) {
    if (!filtersContainer) return;

    // Determine key for config
    const key = categoryType === 'real' ? 'real_life' : 'virtual';
    const filters = filterCategories[key] || [];

    // Clear existing
    filtersContainer.innerHTML = '';
    currentFilter = null; // Reset selection on tab switch

    filters.forEach(filterName => {
        const btn = document.createElement('button');
        btn.className = 'px-4 py-2 bg-transparent text-gray-300 border border-gray-600 rounded-full text-sm font-medium shadow-sm hover:border-gray-400 hover:text-white transition-colors whitespace-nowrap';
        btn.textContent = filterName;

        btn.addEventListener('click', function () {
            const filterText = this.textContent.trim();
            const allButtons = filtersContainer.querySelectorAll('button');

            if (currentFilter === filterText) {
                currentFilter = null;
                this.classList.remove('bg-white', 'text-black', 'border-white');
                this.classList.add('bg-transparent', 'text-gray-300', 'border-gray-600');
            } else {
                currentFilter = filterText;
                allButtons.forEach(b => {
                    b.classList.remove('bg-white', 'text-black', 'border-white');
                    b.classList.add('bg-transparent', 'text-gray-300', 'border-gray-600');
                });
                this.classList.remove('bg-transparent', 'text-gray-300', 'border-gray-600');
                this.classList.add('bg-white', 'text-black', 'border-white');
            }
            renderListings();
        });

        filtersContainer.appendChild(btn);
    });

    // Add horizontal scroll wrapper look (optional padding)
    filtersContainer.className = 'flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide';
}

// Logic moved to header.js
// document.addEventListener('DOMContentLoaded', () => { ... setupHeaderInteractions() }) call is removed from here 
// but we keep renderFilters and fetchListings calls.

// Notification Logic removed (in header.js)

// Global scope
window.switchTab = switchTab;
window.clearFilter = clearFilter;

// Message Modal Logic
let currentRecipientId = null;
let currentListingId = null;

function openMessageModal(recipientId, recipientName, listingId, listingTitle) {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return;
    }

    const currentUser = Auth.getUser();
    if (currentUser && currentUser.id === recipientId) {
        showToast('Kendine mesaj atamazsın!', 'error');
        return;
    }

    currentRecipientId = recipientId;
    currentListingId = listingId;

    document.getElementById('modal-recipient-name').textContent = recipientName;
    document.getElementById('modal-listing-title').textContent = listingTitle;
    document.getElementById('message-content').value = '';

    document.getElementById('message-modal').classList.remove('hidden');
}
window.openMessageModal = openMessageModal;

function closeMessageModal() {
    document.getElementById('message-modal').classList.add('hidden');
    currentRecipientId = null;
    currentListingId = null;
}
window.closeMessageModal = closeMessageModal;

// Send Message Handler
document.getElementById('btn-send-message')?.addEventListener('click', async () => {
    const content = document.getElementById('message-content').value.trim();
    if (!content) {
        showToast('Lütfen bir mesaj yazın.', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                receiver_id: currentRecipientId,
                listing_id: currentListingId,
                content: content
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast('Mesajınız başarıyla gönderildi!', 'success');
            closeMessageModal();
        } else {
            showToast(data.message || 'Mesaj gönderilemedi.', 'error');
        }
    } catch (error) {
        console.error('Message error:', error);
        showToast('Bir bağlantı hatası oluştu.', 'error');
    }
});
