// Events Page Logic
// API_URL is defined by auth.js

let currentTimeFilter = 'upcoming';
let currentCatFilter = 'all';

document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getUser();
    if (user) {
        const btn = document.getElementById('btn-create-event');
        if (btn) btn.classList.remove('hidden');
    }
    loadEvents();
});

// Filters
function filterTime(btn) {
    document.querySelectorAll('.time-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    });
    btn.classList.add('active');
    btn.classList.remove('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    currentTimeFilter = btn.dataset.time;
    loadEvents();
}

function filterCategory(btn) {
    document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    });
    btn.classList.add('active');
    btn.classList.remove('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    currentCatFilter = btn.dataset.filter;
    loadEvents();
}

// Load events
async function loadEvents() {
    const grid = document.getElementById('events-grid');
    grid.innerHTML = '<div class="text-center text-gray-500 py-12 col-span-full"><div class="animate-pulse">Yükleniyor...</div></div>';

    try {
        let url = `${API_URL}/events?time=${currentTimeFilter}`;
        if (currentCatFilter !== 'all') url += `&category=${currentCatFilter}`;

        const headers = {};
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(url, { headers });
        const events = await resp.json();

        if (events.length === 0) {
            grid.innerHTML = `
                <div class="text-center py-16 col-span-full">
                    <div class="text-4xl mb-3">📅</div>
                    <p class="text-gray-400 text-lg">${currentTimeFilter === 'past' ? 'Geçmiş etkinlik bulunamadı.' : 'Yaklaşan etkinlik yok.'}</p>
                    <p class="text-gray-500 text-sm mt-1">İlk etkinliği sen oluştur!</p>
                </div>`;
            return;
        }

        grid.innerHTML = events.map(e => renderEventCard(e)).join('');
    } catch (e) {
        console.error('Load events failed:', e);
        grid.innerHTML = '<div class="text-center text-gray-500 py-12 col-span-full">Etkinlikler yüklenemedi.</div>';
    }
}

function renderEventCard(e) {
    const catLabels = { game: '🎮 Oyun', sport: '⚽ Spor', other: '📌 Diğer' };
    const date = new Date(e.event_date);
    const dateStr = date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    const isPast = date < new Date();
    const capacityStr = e.max_participants > 0 ? `${e.participant_count}/${e.max_participants}` : `${e.participant_count}`;
    const isFull = e.max_participants > 0 && e.participant_count >= e.max_participants;

    return `
        <div class="event-card glass-panel rounded-2xl p-5 cursor-pointer animate-fade-in ${isPast ? 'opacity-60' : ''}" onclick="openDetail(${e.id})">
            <div class="flex items-start justify-between mb-3">
                <span class="text-xs text-gray-500 bg-[#252525] px-2 py-1 rounded-lg">${catLabels[e.category] || '📌 Diğer'}</span>
                ${e.joined ? '<span class="text-xs text-green-400 font-medium">✓ Katılıyorsun</span>' : ''}
            </div>
            <h3 class="text-white font-bold text-lg mb-2">${escapeHtml(e.title)}</h3>
            ${e.description ? `<p class="text-gray-400 text-sm mb-3 line-clamp-2">${escapeHtml(e.description)}</p>` : ''}
            <div class="flex flex-wrap gap-3 text-xs text-gray-500">
                <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                    ${dateStr}
                </span>
                <span class="flex items-center gap-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    ${timeStr}
                </span>
                ${e.location ? `<span class="flex items-center gap-1">📍 ${escapeHtml(e.location)}</span>` : ''}
                <span class="flex items-center gap-1">👥 ${capacityStr} ${isFull ? '<span class="text-red-400">(Dolu)</span>' : ''}</span>
            </div>
        </div>
    `;
}

// Detail Modal
async function openDetail(eventId) {
    const modal = document.getElementById('detail-modal');
    document.getElementById('detail-title').textContent = 'Yükleniyor...';
    document.getElementById('detail-content').innerHTML = '<div class="animate-pulse text-gray-500 text-center py-4">Yükleniyor...</div>';
    modal.classList.remove('hidden');

    try {
        const headers = {};
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(`${API_URL}/events/${eventId}`, { headers });
        const ev = await resp.json();

        document.getElementById('detail-title').textContent = ev.title;

        const user = Auth.getUser();
        const isCreator = user && user.id === ev.creator_id;
        const isJoined = ev.participants?.some(p => user && p.user_id === user.id);
        const date = new Date(ev.event_date);
        const isPast = date < new Date();
        const isFull = ev.max_participants > 0 && ev.participant_count >= ev.max_participants;
        const catLabels = { game: '🎮 Oyun', sport: '⚽ Spor', other: '📌 Diğer' };

        let actionHTML = '';
        if (user && !isPast) {
            if (isJoined && !isCreator) {
                actionHTML = `<button onclick="leaveEvent(${eventId})" class="bg-[#252525] hover:bg-red-500/10 text-red-400 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-700 hover:border-red-500/30 transition-all w-full">Ayrıl</button>`;
            } else if (!isJoined && !isFull) {
                actionHTML = `<button onclick="joinEvent(${eventId})" class="bg-white hover:bg-gray-200 text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all w-full active:scale-95">Katıl</button>`;
            } else if (isFull && !isJoined) {
                actionHTML = `<div class="text-center text-red-400 text-sm py-2">Etkinlik dolu.</div>`;
            }
            if (isCreator) {
                actionHTML += `<button onclick="deleteEvent(${eventId})" class="bg-[#252525] hover:bg-red-500/10 text-red-400 px-5 py-2.5 rounded-xl text-sm font-medium border border-gray-700 hover:border-red-500/30 transition-all w-full mt-2">Etkinliği Sil</button>`;
            }
        }

        document.getElementById('detail-content').innerHTML = `
            <div class="space-y-4">
                ${ev.description ? `<p class="text-gray-300 text-sm">${escapeHtml(ev.description)}</p>` : ''}
                <div class="grid grid-cols-2 gap-3 text-sm">
                    <div class="bg-[#0f0f0f] rounded-xl p-3">
                        <p class="text-gray-500 text-xs mb-1">Tarih & Saat</p>
                        <p class="text-white font-medium">${date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                        <p class="text-gray-400">${date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <div class="bg-[#0f0f0f] rounded-xl p-3">
                        <p class="text-gray-500 text-xs mb-1">Detaylar</p>
                        <p class="text-white font-medium">${catLabels[ev.category] || '📌 Diğer'}</p>
                        ${ev.location ? `<p class="text-gray-400">📍 ${escapeHtml(ev.location)}</p>` : ''}
                        <p class="text-gray-400">👥 ${ev.participant_count}${ev.max_participants > 0 ? '/' + ev.max_participants : ''} kişi</p>
                    </div>
                </div>

                <!-- Participants -->
                <div>
                    <h3 class="text-white font-bold text-sm mb-3">Katılımcılar (${ev.participants?.length || 0})</h3>
                    <div class="flex flex-wrap gap-2">
                        ${(ev.participants || []).map(p => {
            const avatar = p.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + p.username;
            return `<a href="profile.html?username=${p.username}" class="flex items-center gap-2 bg-[#0f0f0f] rounded-lg px-3 py-2 hover:bg-[#1a1a1a] transition-colors">
                                <img src="${avatar}" class="w-6 h-6 rounded-full bg-[#252525]">
                                <span class="text-white text-xs font-medium">${p.username}</span>
                            </a>`;
        }).join('')}
                    </div>
                </div>

                ${actionHTML ? `<div class="pt-2">${actionHTML}</div>` : ''}
            </div>
        `;
    } catch (e) {
        document.getElementById('detail-content').innerHTML = '<div class="text-red-400 text-center py-4">Yüklenemedi.</div>';
    }
}

function closeDetailModal() {
    document.getElementById('detail-modal').classList.add('hidden');
}

// CRUD
function openCreateModal() { document.getElementById('create-modal').classList.remove('hidden'); }
function closeCreateModal() { document.getElementById('create-modal').classList.add('hidden'); }

async function createEvent() {
    const title = document.getElementById('modal-title').value.trim();
    const description = document.getElementById('modal-desc').value.trim();
    const event_date = document.getElementById('modal-date').value;
    const category = document.getElementById('modal-cat').value;
    const location = document.getElementById('modal-location').value.trim();
    const max_participants = document.getElementById('modal-max').value;

    if (!title) return showToast('Başlık zorunlu.', 'error');
    if (!event_date) return showToast('Tarih zorunlu.', 'error');

    try {
        const resp = await fetch(`${API_URL}/events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Auth.getToken()}` },
            body: JSON.stringify({ title, description, event_date, category, location, max_participants })
        });
        if (resp.status === 401) { Auth.logout(); return; }
        if (resp.ok) {
            closeCreateModal();
            showToast('Etkinlik oluşturuldu!', 'success');
            loadEvents();
        } else {
            const data = await resp.json();
            showToast(data.message || 'Oluşturulamadı.', 'error');
        }
    } catch (e) { showToast('Bir hata oluştu.', 'error'); }
}

async function joinEvent(id) {
    try {
        const resp = await fetch(`${API_URL}/events/${id}/join`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            showToast('Katıldın!', 'success');
            closeDetailModal();
            loadEvents();
        } else {
            const data = await resp.json();
            showToast(data.message, 'error');
        }
    } catch (e) { showToast('Hata.', 'error'); }
}

async function leaveEvent(id) {
    if (!confirm('Etkinlikten ayrılmak istediğine emin misin?')) return;
    try {
        const resp = await fetch(`${API_URL}/events/${id}/leave`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            showToast('Ayrıldın.', 'success');
            closeDetailModal();
            loadEvents();
        } else {
            const data = await resp.json();
            showToast(data.message, 'error');
        }
    } catch (e) { showToast('Hata.', 'error'); }
}

async function deleteEvent(id) {
    if (!confirm('Bu etkinliği silmek istediğine emin misin?')) return;
    try {
        const resp = await fetch(`${API_URL}/events/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });
        if (resp.ok) {
            showToast('Etkinlik silindi.', 'success');
            closeDetailModal();
            loadEvents();
        }
    } catch (e) { showToast('Silinemedi.', 'error'); }
}

// Utils
function escapeHtml(t) { const d = document.createElement('div'); d.textContent = t; return d.innerHTML; }
function showToast(message, type = 'info') {
    const c = document.getElementById('toast-container'), t = document.createElement('div');
    const bg = type === 'success' ? 'bg-green-600' : type === 'error' ? 'bg-red-600' : 'bg-[#252525]';
    const icon = type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ';
    t.className = `${bg} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 transform translate-x-full transition-transform duration-300`;
    t.innerHTML = `<span class="text-lg">${icon}</span> ${message}`;
    c.appendChild(t);
    requestAnimationFrame(() => t.classList.remove('translate-x-full'));
    setTimeout(() => { t.classList.add('translate-x-full'); setTimeout(() => t.remove(), 300); }, 3000);
}
