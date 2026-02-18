// Groups Page Logic
// API_URL is defined by auth.js

let currentCategoryFilter = 'all';
let searchTimeout = null;

document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getUser();

    // Determine which page we're on
    const isDetailPage = window.location.pathname.includes('group.html');

    if (isDetailPage) {
        const params = new URLSearchParams(window.location.search);
        const groupId = params.get('id');
        if (!groupId) {
            window.location.href = 'groups.html';
            return;
        }
        loadGroupDetail(groupId);
    } else {
        // Groups listing page
        if (user) {
            const btn = document.getElementById('btn-create-group');
            if (btn) btn.classList.remove('hidden');
        }
        loadGroups();
    }
});

// ===================== GROUPS LISTING =====================

function filterGroups(btn) {
    document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    });
    btn.classList.add('active');
    btn.classList.remove('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    currentCategoryFilter = btn.dataset.filter;
    loadGroups();
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => loadGroups(), 400);
}

async function loadGroups() {
    const grid = document.getElementById('groups-grid');
    if (!grid) return;
    grid.innerHTML = '<div class="text-center text-gray-500 py-12 col-span-full"><div class="animate-pulse">Yükleniyor...</div></div>';

    try {
        let url = `${API_URL}/groups?`;
        if (currentCategoryFilter !== 'all') url += `category=${currentCategoryFilter}&`;
        const searchVal = document.getElementById('search-input')?.value?.trim();
        if (searchVal) url += `search=${encodeURIComponent(searchVal)}&`;

        const headers = {};
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(url, { headers });
        const groups = await resp.json();

        if (groups.length === 0) {
            grid.innerHTML = `
                <div class="text-center py-16 col-span-full">
                    <div class="text-4xl mb-3">🏠</div>
                    <p class="text-gray-400 text-lg">Henüz grup yok.</p>
                    <p class="text-gray-500 text-sm mt-1">İlk grubu sen oluştur!</p>
                </div>`;
            return;
        }

        grid.innerHTML = groups.map(g => renderGroupCard(g)).join('');
    } catch (e) {
        console.error('Load groups failed:', e);
        grid.innerHTML = '<div class="text-center text-gray-500 py-12 col-span-full">Gruplar yüklenemedi.</div>';
    }
}

function renderGroupCard(g) {
    const catLabels = { game: '🎮 Oyun', sport: '⚽ Spor', other: '📌 Diğer' };
    const avatar = g.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${g.name}`;

    return `
        <a href="group.html?id=${g.id}" class="group-card glass-panel rounded-2xl p-5 cursor-pointer block animate-fade-in">
            <div class="flex items-center gap-4 mb-3">
                <img src="${avatar}" alt="${escapeHtml(g.name)}" class="w-12 h-12 rounded-xl bg-[#252525] border border-gray-700 object-cover">
                <div class="min-w-0 flex-1">
                    <h3 class="text-white font-bold text-sm truncate">${escapeHtml(g.name)}</h3>
                    <span class="text-xs text-gray-500">${catLabels[g.category] || '📌 Diğer'}</span>
                </div>
            </div>
            ${g.description ? `<p class="text-gray-400 text-xs mb-3 line-clamp-2">${escapeHtml(g.description)}</p>` : ''}
            <div class="flex items-center justify-between">
                <span class="text-xs text-gray-500">👥 ${g.member_count} üye</span>
                ${g.is_member ? '<span class="text-xs text-green-400 font-medium">✓ Üyesin</span>' : ''}
            </div>
        </a>
    `;
}

// Create Group Modal
function openCreateModal() {
    document.getElementById('create-modal').classList.remove('hidden');
}
function closeCreateModal() {
    document.getElementById('create-modal').classList.add('hidden');
}

async function createGroup() {
    const name = document.getElementById('modal-group-name').value.trim();
    const description = document.getElementById('modal-group-desc').value.trim();
    const category = document.getElementById('modal-group-cat').value;

    if (!name) return showToast('Grup adı zorunlu.', 'error');

    try {
        const resp = await fetch(`${API_URL}/groups`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ name, description, category })
        });

        if (resp.status === 401) { Auth.logout(); return; }

        const data = await resp.json();
        if (resp.ok) {
            closeCreateModal();
            showToast('Grup oluşturuldu!', 'success');
            window.location.href = `group.html?id=${data.groupId}`;
        } else {
            showToast(data.message || 'Oluşturulamadı.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// ===================== GROUP DETAIL =====================

let currentGroupId = null;
let currentGroupData = null;

async function loadGroupDetail(groupId) {
    currentGroupId = groupId;

    try {
        const headers = {};
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(`${API_URL}/groups/${groupId}`, { headers });
        if (resp.status === 404) {
            document.getElementById('group-header').innerHTML = '<div class="text-center text-red-400 py-8">Grup bulunamadı.</div>';
            return;
        }

        const group = await resp.json();
        currentGroupData = group;
        document.title = `${group.name} - Teammate`;

        renderGroupHeader(group);
        renderMembers(group.members);

        // Show post area if member
        if (group.is_member) {
            const postArea = document.getElementById('group-post-area');
            if (postArea) postArea.classList.remove('hidden');
        }

        await loadGroupPosts(groupId);
    } catch (e) {
        console.error('Load group failed:', e);
        document.getElementById('group-header').innerHTML = '<div class="text-center text-red-400 py-8">Grup yüklenemedi.</div>';
    }
}

function renderGroupHeader(g) {
    const catLabels = { game: '🎮 Oyun', sport: '⚽ Spor', other: '📌 Diğer' };
    const avatar = g.avatar_url || `https://api.dicebear.com/7.x/shapes/svg?seed=${g.name}`;
    const user = Auth.getUser();
    const isCreator = user && user.id === g.creator_id;

    let actionBtn = '';
    if (user) {
        if (g.is_member && !isCreator) {
            actionBtn = `<button onclick="leaveGroup()" class="bg-[#252525] hover:bg-red-500/10 text-red-400 px-5 py-2 rounded-xl text-sm font-medium border border-gray-700 hover:border-red-500/30 transition-all">Ayrıl</button>`;
        } else if (!g.is_member) {
            actionBtn = `<button onclick="joinGroup()" class="bg-white hover:bg-gray-200 text-black px-5 py-2 rounded-xl text-sm font-bold shadow-lg shadow-white/10 transition-all hover:shadow-white/20 active:scale-95">Katıl</button>`;
        }
        if (isCreator) {
            actionBtn += ` <button onclick="deleteGroup()" class="bg-[#252525] hover:bg-red-500/10 text-red-400 px-4 py-2 rounded-xl text-sm font-medium border border-gray-700 hover:border-red-500/30 transition-all" title="Grubu Sil">🗑️</button>`;
        }
    }

    document.getElementById('group-header').innerHTML = `
        <div class="flex flex-col sm:flex-row items-center gap-5">
            <img src="${avatar}" alt="${escapeHtml(g.name)}" class="w-20 h-20 rounded-2xl bg-[#252525] border border-gray-700 object-cover">
            <div class="flex-1 text-center sm:text-left">
                <div class="flex items-center gap-2 justify-center sm:justify-start">
                    <h1 class="text-2xl font-bold text-white">${escapeHtml(g.name)}</h1>
                    <span class="text-xs text-gray-500 bg-[#252525] px-2 py-1 rounded-lg">${catLabels[g.category] || '📌 Diğer'}</span>
                </div>
                ${g.description ? `<p class="text-gray-400 text-sm mt-1">${escapeHtml(g.description)}</p>` : ''}
                <div class="flex items-center gap-4 mt-2 text-xs text-gray-500 justify-center sm:justify-start">
                    <span>👥 ${g.member_count} üye</span>
                    <span>Kurucu: <a href="profile.html?username=${g.creator_name}" class="text-gray-300 hover:underline">${g.creator_name}</a></span>
                </div>
            </div>
            <div class="flex gap-2">${actionBtn}</div>
        </div>
    `;
}

function renderMembers(members) {
    const list = document.getElementById('members-list');
    if (!list) return;

    list.innerHTML = members.map(m => {
        const avatar = m.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.username}`;
        const badge = m.role === 'admin' ? '<span class="text-xs text-yellow-400">👑</span>' : '';
        return `
            <a href="profile.html?username=${m.username}" class="flex items-center gap-3 hover:bg-white/5 rounded-lg p-2 -mx-2 transition-colors">
                <img src="${avatar}" class="w-8 h-8 rounded-full bg-[#252525] border border-gray-700 object-cover">
                <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-1">
                        <span class="text-white text-sm font-medium truncate">${m.username}</span>
                        ${badge}
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

async function joinGroup() {
    try {
        const resp = await fetch(`${API_URL}/groups/${currentGroupId}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            showToast('Gruba katıldın!', 'success');
            loadGroupDetail(currentGroupId);
        } else {
            const data = await resp.json();
            showToast(data.message || 'Katılma başarısız.', 'error');
        }
    } catch (e) { showToast('Bir hata oluştu.', 'error'); }
}

async function leaveGroup() {
    if (!confirm('Bu gruptan ayrılmak istediğine emin misin?')) return;
    try {
        const resp = await fetch(`${API_URL}/groups/${currentGroupId}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            showToast('Gruptan ayrıldın.', 'success');
            loadGroupDetail(currentGroupId);
        } else {
            const data = await resp.json();
            showToast(data.message || 'Ayrılma başarısız.', 'error');
        }
    } catch (e) { showToast('Bir hata oluştu.', 'error'); }
}

async function deleteGroup() {
    if (!confirm('Bu grubu kalıcı olarak silmek istediğine emin misin?')) return;
    try {
        const resp = await fetch(`${API_URL}/groups/${currentGroupId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            showToast('Grup silindi.', 'success');
            setTimeout(() => window.location.href = 'groups.html', 1000);
        }
    } catch (e) { showToast('Silinemedi.', 'error'); }
}

// Group Posts
async function loadGroupPosts(groupId) {
    const feed = document.getElementById('group-posts-feed');
    if (!feed) return;

    try {
        const resp = await fetch(`${API_URL}/groups/${groupId}/posts`);
        const posts = await resp.json();

        if (posts.length === 0) {
            feed.innerHTML = '<div class="text-center py-12"><div class="text-3xl mb-2">💬</div><p class="text-gray-500 text-sm">Henüz gönderi yok. İlk paylaşımı sen yap!</p></div>';
            return;
        }

        const user = Auth.getUser();
        feed.innerHTML = posts.map(p => {
            const avatar = p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`;
            const isOwner = user && user.id === p.user_id;
            const isAdmin = currentGroupData && currentGroupData.my_role === 'admin';

            return `
                <div class="glass-panel rounded-2xl p-5 mb-3 animate-fade-in" id="gpost-${p.id}">
                    <div class="flex items-start justify-between mb-2">
                        <div class="flex items-center gap-3">
                            <a href="profile.html?username=${p.username}">
                                <img src="${avatar}" class="w-9 h-9 rounded-full bg-[#252525] border border-gray-700 object-cover hover:border-gray-500 transition-colors">
                            </a>
                            <div>
                                <a href="profile.html?username=${p.username}" class="text-white font-semibold text-sm hover:underline">${p.username}</a>
                                <p class="text-xs text-gray-500">${getTimeAgo(new Date(p.created_at))}</p>
                            </div>
                        </div>
                        ${isOwner || isAdmin ? `
                            <button onclick="deleteGroupPost(${p.id})" class="text-gray-600 hover:text-red-400 transition-colors p-1" title="Sil">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        ` : ''}
                    </div>
                    <p class="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">${escapeHtml(p.content)}</p>
                </div>
            `;
        }).join('');
    } catch (e) {
        feed.innerHTML = '<div class="text-center text-red-400 py-8">Gönderiler yüklenemedi.</div>';
    }
}

async function createGroupPost() {
    const textarea = document.getElementById('group-post-content');
    const content = textarea.value.trim();
    if (!content) return showToast('Boş gönderi paylaşamazsın.', 'error');

    try {
        const resp = await fetch(`${API_URL}/groups/${currentGroupId}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ content })
        });

        if (resp.ok) {
            textarea.value = '';
            await loadGroupPosts(currentGroupId);
            showToast('Gönderi paylaşıldı!', 'success');
        } else {
            const data = await resp.json();
            showToast(data.message || 'Paylaşım başarısız.', 'error');
        }
    } catch (e) { showToast('Bir hata oluştu.', 'error'); }
}

async function deleteGroupPost(postId) {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return;
    try {
        const resp = await fetch(`${API_URL}/groups/${currentGroupId}/posts/${postId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            document.getElementById(`gpost-${postId}`)?.remove();
            showToast('Gönderi silindi.', 'success');
        }
    } catch (e) { showToast('Silinemedi.', 'error'); }
}

// ===================== UTILITIES =====================

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}g önce`;
    return `${Math.floor(days / 30)}ay önce`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-[#252525]';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    toast.className = `${bgColor} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transform translate-x-full transition-transform duration-300`;
    toast.innerHTML = `<span class="text-lg">${icon}</span> ${message}`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.remove('translate-x-full'));
    setTimeout(() => { toast.classList.add('translate-x-full'); setTimeout(() => toast.remove(), 300); }, 3000);
}
