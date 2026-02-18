// Profile Page Logic
// API_URL is defined by auth.js (loaded before this script)

let currentProfile = null;
let profileUsername = null;
const urlParams = new URLSearchParams(window.location.search);
const paramUsername = urlParams.get('username');

document.addEventListener('DOMContentLoaded', async () => {
    // Determine which profile to load
    const currentUser = Auth.getUser();

    if (paramUsername) {
        profileUsername = paramUsername;
    } else if (currentUser) {
        profileUsername = currentUser.username;
    } else {
        window.location.href = 'login.html';
        return;
    }

    console.log('Loading profile for:', profileUsername); // Keep console log for safe measure
    // alert('Debug: Loading profile for ' + profileUsername); // Commented out to avoid annoyance, but good for manual test if needed.

    if (!profileUsername || profileUsername === 'undefined') {
        alert('Hata: Kullanıcı adı bulunamadı. Lütfen tekrar giriş yapın.');
        Auth.logout();
        return;
    }

    // Auto-set status to 'online' when viewing own profile (before loading profile data)
    if (currentUser && currentUser.username === profileUsername) {
        try {
            const statusResp = await fetch(`${API_URL}/profile/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${Auth.getToken()}`
                },
                body: JSON.stringify({ availability_status: 'online' })
            });
            if (statusResp.status === 401) {
                console.warn('[Profile] Token expired, please re-login.');
                Auth.logout();
                return;
            }
        } catch (e) { console.error('Auto-status update failed:', e); }
    }

    loadProfile(profileUsername);

    // Event Listeners
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => { openEditModal(); generateAvatarCatalog(); });
    document.getElementById('btn-save-profile')?.addEventListener('click', saveProfile);

    document.getElementById('btn-add-virtual')?.addEventListener('click', () => openInterestModal('virtual'));
    document.getElementById('btn-add-real')?.addEventListener('click', () => openInterestModal('real_life'));
    document.getElementById('btn-save-interest')?.addEventListener('click', saveInterest);

    document.getElementById('btn-post-comment')?.addEventListener('click', postComment);

    // Tab Switching
    window.switchTab = (tabName) => {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`.tab-btn[onclick="switchTab('${tabName}')"]`).classList.add('active');

        document.getElementById('tab-listings').classList.add('hidden');
        document.getElementById('tab-posts').classList.add('hidden');
        document.getElementById('tab-comments').classList.add('hidden');
        document.getElementById(`tab-${tabName}`).classList.remove('hidden');

        if (tabName === 'posts' && profileUsername) loadUserPosts(profileUsername);
    };
});

async function loadProfile(username) {
    try {
        const response = await fetch(`${API_URL}/profile/${username}`);
        if (!response.ok) {
            if (response.status === 404) {
                alert('Kullanıcı bulunamadı.');
                window.location.href = 'home.html';
                return;
            }
            throw new Error('Profile load failed');
        }

        const data = await response.json();
        currentProfile = data;
        renderProfile(data);
    } catch (error) {
        console.error('Load profile error:', error);
    }
}

function renderProfile(data) {
    const user = data.user;
    const isOwner = Auth.getUser() && Auth.getUser().username === user.username;

    // Header Info
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-city').querySelector('.city-text').textContent = user.city || 'Konum belirtilmemiş';
    document.getElementById('profile-bio').textContent = user.bio || 'Henüz bir biyografi eklenmemiş.';
    document.getElementById('profile-avatar').src = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;

    // Status Indicator coloring
    const statusColor = {
        'online': 'bg-green-500',
        'offline': 'bg-gray-500',
        'looking_for_team': 'bg-blue-500',
        'in_game': 'bg-purple-500'
    }[user.availability_status || 'offline'];

    document.getElementById('status-indicator').className = `absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#252525] ${statusColor}`;

    // Stats
    document.getElementById('stat-listings').textContent = data.stats.listings;
    document.getElementById('stat-comments').textContent = data.comments.length;

    // Socials
    const socialsContainer = document.getElementById('social-links-container');
    socialsContainer.innerHTML = '';
    if (user.social_links && user.social_links.discord) {
        socialsContainer.innerHTML += `
            <div class="flex items-center gap-1 text-indigo-400" title="Discord">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/></svg>
                <span>${escapeHtml(user.social_links.discord)}</span>
            </div>
        `;
    }

    // Controls for Owner
    if (isOwner) {
        document.getElementById('btn-edit-profile').classList.remove('hidden');
        document.getElementById('btn-status-toggle').classList.remove('hidden');
        document.getElementById('btn-add-virtual').classList.remove('hidden');
        document.getElementById('btn-add-real').classList.remove('hidden');

        // Update Status Button Text
        const statusLabels = {
            'online': '🟢 Çevrimiçi',
            'offline': '⚫ Çevrimdışı',
            'looking_for_team': '🔵 Takım Arıyor',
            'in_game': '🟣 Oyunda'
        };
        const statusBtn = document.getElementById('btn-status-toggle');
        statusBtn.textContent = `Durum: ${statusLabels[user.availability_status] || statusLabels['offline']}`;

        // Status Toggle Click Handler (cycle through statuses)
        const statusOrder = ['online', 'offline', 'looking_for_team', 'in_game'];
        statusBtn.onclick = async () => {
            const currentIdx = statusOrder.indexOf(user.availability_status || 'offline');
            const nextStatus = statusOrder[(currentIdx + 1) % statusOrder.length];

            try {
                const response = await fetch(`${API_URL}/profile/update`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${Auth.getToken()}`
                    },
                    body: JSON.stringify({ availability_status: nextStatus })
                });

                if (response.ok) {
                    user.availability_status = nextStatus;
                    statusBtn.textContent = `Durum: ${statusLabels[nextStatus]}`;

                    // Update status indicator color
                    const newColor = {
                        'online': 'bg-green-500',
                        'offline': 'bg-gray-500',
                        'looking_for_team': 'bg-blue-500',
                        'in_game': 'bg-purple-500'
                    }[nextStatus];
                    document.getElementById('status-indicator').className = `absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-[#252525] ${newColor}`;
                }
            } catch (e) {
                console.error('Status update error:', e);
            }
        };

        // Populate Edit Modal
        document.getElementById('edit-city').value = user.city || '';
        document.getElementById('edit-bio').value = user.bio || '';
        document.getElementById('edit-discord').value = user.social_links?.discord || '';
        document.getElementById('edit-avatar').value = user.avatar_url || '';
    }

    // Render Interests
    const vContainer = document.getElementById('interests-virtual');
    const rContainer = document.getElementById('interests-real');

    // Clear placeholders if we have data
    if (data.interests.filter(i => i.category === 'virtual').length > 0) vContainer.innerHTML = '';
    if (data.interests.filter(i => i.category === 'real_life').length > 0) rContainer.innerHTML = '';

    data.interests.forEach(interest => {
        const roles = interest.metadata ? JSON.parse(JSON.stringify(interest.metadata)) : []; // Parse if string? No, already object from API? 
        // wait, db returns JSON column as object? mysql2 does if configured?
        // Let's assume it's array.

        const rolesHtml = Array.isArray(roles) ? roles.map(r => `<span class="bg-[#252525] text-xs px-2 py-1 rounded border border-gray-700 text-gray-300">${escapeHtml(r)}</span>`).join('') : '';

        const html = `
            <div class="flex items-center justify-between group">
                <div>
                    <div class="font-medium text-white">${escapeHtml(interest.name)}</div>
                    <div class="flex flex-wrap gap-1 mt-1">${rolesHtml}</div>
                </div>
                ${isOwner ? `<button onclick="deleteInterest(${interest.id})" class="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs">Sil</button>` : ''}
            </div>
        `;

        if (interest.category === 'virtual') vContainer.innerHTML += html;
        else rContainer.innerHTML += html;
    });

    // Render Comments
    const commentsContainer = document.getElementById('comments-list');
    commentsContainer.innerHTML = '';

    if (data.comments.length === 0) {
        commentsContainer.innerHTML = '<div class="text-center text-gray-600 italic py-4">Henüz yorum yapılmamış. İlk yorumu sen yap!</div>';
    } else {
        data.comments.forEach(comment => {
            const isAuthor = Auth.getUser() && Auth.getUser().id === comment.author_user_id;
            const canDelete = isOwner || isAuthor;

            commentsContainer.innerHTML += `
                <div class="bg-[#1a1a1a] rounded-xl p-4 border border-gray-800 flex gap-4">
                    <img src="${comment.author_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author_name}`}" class="w-10 h-10 rounded-full bg-gray-800">
                    <div class="flex-1">
                        <div class="flex items-center justify-between mb-1">
                            <span class="font-bold text-white text-sm hover:underline cursor-pointer" onclick="window.location.href='profile.html?username=${comment.author_name}'">${escapeHtml(comment.author_name)}</span>
                            <span class="text-xs text-gray-500">${timeAgo(comment.created_at)}</span>
                        </div>
                        <p class="text-gray-300 text-sm">${escapeHtml(comment.content)}</p>
                    </div>
                     ${canDelete ? `<button onclick="deleteComment(${comment.id})" class="text-red-500 hover:text-red-400 text-xs self-start ml-2">Sil</button>` : ''}
                </div>
            `;
        });
    }

    // Load Listings
    loadListings(user.username);
}

async function loadListings(username) {
    const listContainer = document.getElementById('tab-listings');
    listContainer.innerHTML = '<div class="text-center text-gray-400">Yükleniyor...</div>';

    try {
        const response = await fetch(`${API_URL}/listings?username=${username}`);
        if (!response.ok) throw new Error('Failed to fetch listings');
        const listings = await response.json();

        listContainer.innerHTML = '';
        if (listings.length === 0) {
            listContainer.innerHTML = '<div class="text-center text-gray-500 py-4">Henüz aktif ilan yok.</div>';
            return;
        }

        const currentUser = Auth.getUser();
        const isOwner = currentUser && currentUser.username === username;

        listings.forEach(listing => {
            const date = new Date(listing.activity_date);
            const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' });
            const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

            const isVirtual = listing.category_slug === 'virtual';
            const icon = isVirtual ?
                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>' :
                '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>';

            listContainer.innerHTML += `
             <div class="glass-panel p-4 rounded-xl hover:bg-white/5 transition-colors cursor-pointer border border-[#333] group relative" onclick="openListingModal(${listing.id})">
                <div class="flex items-center justify-between mb-2">
                    <div class="flex items-center gap-2 text-sm text-gray-400">
                        <span class="${isVirtual ? 'text-purple-400' : 'text-green-400'} flex items-center gap-1">
                           ${icon} ${escapeHtml(listing.category_name)}
                        </span>
                        <span>•</span>
                        <span>${escapeHtml(listing.subcategory)}</span>
                    </div>
                    ${isOwner ? `<button onclick="event.stopPropagation(); deleteListing(${listing.id})" class="text-red-500 hover:text-red-400 text-xs px-2 py-1 rounded border border-red-500/30 hover:bg-red-500/10 transition-colors">İlanı Sil</button>` : ''}
                </div>
                <h3 class="text-white font-bold text-lg mb-1 group-hover:text-blue-400 transition-colors">${escapeHtml(listing.title)}</h3>
                <div class="flex items-center gap-4 text-sm text-gray-500">
                   <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        ${dateStr}, ${timeStr}
                    </div>
                    ${listing.location ? `
                    <div class="flex items-center gap-1">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        ${escapeHtml(listing.location)}
                    </div>` : ''}
                </div>
            </div>
            `;
        });
    } catch (e) {
        listContainer.innerHTML = '<div class="text-center text-red-500 py-4">İlanlar yüklenemedi.</div>';
        console.error(e);
    }
}

// Actions

async function saveProfile() {
    if (!Auth.getToken()) return;

    const data = {
        city: document.getElementById('edit-city').value.trim(),
        bio: document.getElementById('edit-bio').value.trim(),
        avatar_url: document.getElementById('edit-avatar').value.trim(),
        social_links: {
            discord: document.getElementById('edit-discord').value.trim()
        }
    };

    try {
        const response = await fetch(`${API_URL}/profile/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            closeEditModal();
            loadProfile(profileUsername); // Reload
        } else {
            alert('Güncelleme başarısız.');
        }
    } catch (e) {
        console.error(e);
    }
}

// Interest Modal
let currentCategory = 'virtual';

function openInterestModal(category) {
    currentCategory = category;
    document.getElementById('interest-modal-title').textContent = category === 'virtual' ? 'Oyun Ekle' : 'Aktivite Ekle';
    document.getElementById('add-interest-modal').classList.remove('hidden');
}

function closeInterestModal() {
    document.getElementById('add-interest-modal').classList.add('hidden');
    document.getElementById('interest-name').value = '';
    document.getElementById('interest-roles').value = '';
}

async function saveInterest() {
    const name = document.getElementById('interest-name').value.trim();
    const rolesStr = document.getElementById('interest-roles').value.trim();

    if (!name) return alert('İsim giriniz.');

    const roles = rolesStr ? rolesStr.split(',').map(s => s.trim()) : [];

    try {
        const response = await fetch(`${API_URL}/profile/interests`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                category: currentCategory,
                name: name,
                metadata: roles
            })
        });

        if (response.ok) {
            closeInterestModal();
            loadProfile(profileUsername);
        } else {
            alert('Ekleme başarısız.');
        }
    } catch (e) { console.error(e); }
}

async function deleteInterest(id) {
    if (!confirm('Silmek istediğine emin misin?')) return;
    try {
        await fetch(`${API_URL}/profile/interests/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        loadProfile(profileUsername);
    } catch (e) { console.error(e); }
}

// Comments
async function postComment() {
    const content = document.getElementById('comment-input').value.trim();
    if (!content) return;

    try {
        const response = await fetch(`${API_URL}/profile/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({
                profile_username: profileUsername,
                content: content
            })
        });

        if (response.ok) {
            document.getElementById('comment-input').value = '';
            loadProfile(profileUsername);
        } else {
            alert('Yorum gönderilemedi.');
        }
    } catch (e) { console.error(e); }
}

async function deleteComment(id) {
    if (!confirm('Yorumu sil?')) return;
    try {
        await fetch(`${API_URL}/profile/comments/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        loadProfile(profileUsername);
    } catch (e) { console.error(e); }
}

// Utils
function openEditModal() {
    document.getElementById('edit-profile-modal').classList.remove('hidden');
}
function closeEditModal() {
    document.getElementById('edit-profile-modal').classList.add('hidden');
}
window.closeEditModal = closeEditModal; // Expose to HTML
window.closeInterestModal = closeInterestModal;
window.deleteInterest = deleteInterest;
window.deleteComment = deleteComment;

// ===================== USER COMMUNITY POSTS =====================

let userPostsLoaded = false;

async function loadUserPosts(username) {
    if (userPostsLoaded) return;
    const container = document.getElementById('tab-posts');
    container.innerHTML = '<div class="text-center text-gray-400 py-4">Yükleniyor...</div>';

    try {
        const headers = {};
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(`${API_URL}/community/posts?username=${encodeURIComponent(username)}`, { headers });
        const posts = await resp.json();

        if (!posts.length) {
            container.innerHTML = '<div class="text-center text-gray-500 py-8"><div class="text-3xl mb-2">📝</div><p>Henüz paylaşım yok.</p></div>';
            return;
        }

        const catLabels = { general: '💬 Genel', game: '🎮 Oyun', sport: '⚽ Spor', question: '❓ Soru' };

        container.innerHTML = posts.map(p => {
            const ta = timeAgo(p.created_at);
            return `
                <div class="glass-panel rounded-xl p-4 border border-[#333] hover:border-gray-600 transition-colors">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <span>${ta}</span>
                            <span>·</span>
                            <span>${catLabels[p.category] || '💬 Genel'}</span>
                        </div>
                        <div class="flex items-center gap-3 text-xs text-gray-500">
                            <span>❤️ ${p.likes_count || 0}</span>
                            <span>💬 ${p.comments_count || 0}</span>
                        </div>
                    </div>
                    <p class="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(p.content)}</p>
                </div>
            `;
        }).join('');

        userPostsLoaded = true;
    } catch (e) {
        console.error('Load user posts error:', e);
        container.innerHTML = '<div class="text-center text-red-400 py-4">Paylaşımlar yüklenemedi.</div>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    if (typeof text !== 'string') return String(text);
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function timeAgo(dateString) {
    // Basic implementation, reuse from main.js if possible or improve
    const date = new Date(dateString);
    const now = new Date();
    const diff = (now - date) / 1000; // seconds

    if (diff < 60) return 'Az önce';
    if (diff < 3600) return `${Math.floor(diff / 60)}dk önce`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}s önce`;
    return `${Math.floor(diff / 86400)}g önce`;
}

async function deleteListing(id) {
    if (!confirm('İlanı silmek istediğinize emin misiniz?')) return;
    try {
        const response = await fetch(`${API_URL}/listings/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });

        if (response.ok) {
            loadListings(profileUsername); // Refresh list
            // Also update stats if we can, or just let page reload do it next time
            // For now just reload listings part
        } else {
            const data = await response.json();
            alert(data.message || 'Silme işlemi başarısız.');
        }
    } catch (e) {
        console.error(e);
        alert('Bir hata oluştu.');
    }
}

window.deleteListing = deleteListing;

// === Avatar Catalog System ===
const AVATAR_SEEDS = [
    'Felix', 'Aneka', 'Shadow', 'Luna', 'Blaze', 'Nox', 'Pixel', 'Storm',
    'Ember', 'Frost', 'Jade', 'Rex', 'Nova', 'Bolt', 'Sage', 'Onyx',
    'Drift', 'Echo', 'Pulse', 'Zen', 'Ace', 'Ivy', 'Kai', 'Lux'
];

const AVATAR_STYLES = ['avataaars', 'bottts', 'pixel-art', 'lorelei', 'adventurer'];

function generateAvatarCatalog() {
    const catalog = document.getElementById('avatar-catalog');
    if (!catalog) return;
    catalog.innerHTML = '';

    const currentAvatarUrl = document.getElementById('edit-avatar').value;

    // Generate avatars from different styles and seeds
    const avatars = [];

    // Add username-based avatar first
    if (profileUsername) {
        avatars.push(`https://api.dicebear.com/7.x/avataaars/svg?seed=${profileUsername}`);
    }

    // Add variety of avatars
    AVATAR_STYLES.forEach(style => {
        AVATAR_SEEDS.slice(0, 5).forEach(seed => {
            avatars.push(`https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`);
        });
    });

    avatars.forEach(url => {
        const wrapper = document.createElement('div');
        wrapper.className = `cursor-pointer rounded-xl border-2 p-1 transition-all hover:scale-110 hover:border-blue-400 ${currentAvatarUrl === url ? 'border-blue-500 bg-blue-500/20 scale-105' : 'border-transparent'}`;
        wrapper.innerHTML = `<img src="${url}" class="w-full aspect-square rounded-lg bg-[#202020]" alt="Avatar">`;
        wrapper.addEventListener('click', () => {
            document.getElementById('edit-avatar').value = url;
            // Update selection visuals
            catalog.querySelectorAll('div').forEach(d => {
                d.className = d.className.replace('border-blue-500 bg-blue-500/20 scale-105', 'border-transparent');
            });
            wrapper.className = wrapper.className.replace('border-transparent', 'border-blue-500 bg-blue-500/20 scale-105');
        });
        catalog.appendChild(wrapper);
    });
}

