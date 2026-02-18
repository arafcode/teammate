// Community Page Logic
// API_URL is defined by auth.js

let currentPage = 1;
let currentFilter = 'all';
let selectedCategory = 'general';

document.addEventListener('DOMContentLoaded', () => {
    const user = Auth.getUser();

    if (user) {
        document.getElementById('create-post-area').classList.remove('hidden');
        document.getElementById('guest-prompt').classList.add('hidden');
        const avatar = user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
        document.getElementById('post-user-avatar').src = avatar;
    } else {
        document.getElementById('create-post-area').classList.add('hidden');
        document.getElementById('guest-prompt').classList.remove('hidden');
    }

    loadPosts();
});

// Category selection for new post
function selectPostCategory(btn) {
    document.querySelectorAll('.post-category-btn').forEach(b => {
        b.classList.remove('active', 'bg-white', 'text-black');
        b.classList.add('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    });
    btn.classList.add('active', 'bg-white', 'text-black');
    btn.classList.remove('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    selectedCategory = btn.dataset.cat;
}

// Filter posts by category
function filterPosts(btn) {
    document.querySelectorAll('.category-btn').forEach(b => {
        b.classList.remove('active');
        b.classList.add('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    });
    btn.classList.add('active');
    btn.classList.remove('bg-[#252525]', 'text-gray-400', 'border', 'border-gray-700');
    currentFilter = btn.dataset.filter;
    currentPage = 1;
    loadPosts();
}

// Load Posts
async function loadPosts(append = false) {
    const feed = document.getElementById('posts-feed');
    if (!append) {
        feed.innerHTML = '<div class="text-center text-gray-500 py-12"><div class="animate-pulse">Yükleniyor...</div></div>';
    }

    try {
        let url = `${API_URL}/community/posts?page=${currentPage}`;
        if (currentFilter !== 'all') url += `&category=${currentFilter}`;

        const headers = {};
        const token = Auth.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const resp = await fetch(url, { headers });
        const posts = await resp.json();

        if (!append) feed.innerHTML = '';

        if (posts.length === 0 && currentPage === 1) {
            feed.innerHTML = `
                <div class="text-center py-16">
                    <div class="text-4xl mb-3">🌱</div>
                    <p class="text-gray-400 text-lg">Henüz gönderi yok.</p>
                    <p class="text-gray-500 text-sm mt-1">İlk paylaşımı sen yap!</p>
                </div>
            `;
        }

        posts.forEach(post => {
            feed.insertAdjacentHTML('beforeend', renderPost(post));
        });

        // Show/hide load more
        const loadMore = document.getElementById('load-more-container');
        if (posts.length >= 20) {
            loadMore.classList.remove('hidden');
        } else {
            loadMore.classList.add('hidden');
        }

    } catch (e) {
        console.error('Load posts failed:', e);
        if (!append) feed.innerHTML = '<div class="text-center text-gray-500 py-12">Gönderiler yüklenemedi.</div>';
    }
}

function loadMorePosts() {
    currentPage++;
    loadPosts(true);
}

// Render a single post
function renderPost(post) {
    const user = Auth.getUser();
    const isOwner = user && user.id === post.user_id;
    const avatar = post.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`;
    const timeAgo = getTimeAgo(new Date(post.created_at));
    const categoryLabels = {
        'general': '💬 Genel',
        'game': '🎮 Oyun',
        'sport': '⚽ Spor',
        'question': '❓ Soru'
    };

    return `
        <div class="post-card glass-panel rounded-2xl p-5 mb-4 animate-fade-in" id="post-${post.id}">
            <!-- Post Header -->
            <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                    <a href="profile.html?username=${post.username}">
                        <img src="${avatar}" alt="${post.username}" class="w-10 h-10 rounded-full bg-[#252525] border border-gray-700 object-cover hover:border-gray-500 transition-colors">
                    </a>
                    <div>
                        <a href="profile.html?username=${post.username}" class="text-white font-semibold text-sm hover:underline">${post.username}</a>
                        <div class="flex items-center gap-2 text-xs text-gray-500">
                            <span>${timeAgo}</span>
                            <span>·</span>
                            <span>${categoryLabels[post.category] || '💬 Genel'}</span>
                        </div>
                    </div>
                </div>
                ${isOwner ? `
                    <button onclick="deletePost(${post.id})" class="text-gray-600 hover:text-red-400 transition-colors p-1" title="Sil">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                    </button>
                ` : ''}
            </div>

            <!-- Post Content -->
            <div class="text-white/90 text-sm leading-relaxed mb-4 whitespace-pre-wrap">${escapeHtml(post.content)}</div>

            <!-- Post Actions -->
            <div class="flex items-center gap-6 text-gray-500 text-sm">
                <button onclick="toggleLike(${post.id})" class="like-btn flex items-center gap-1.5 hover:text-red-400 transition-colors ${post.liked_by_me ? 'liked' : ''}" id="like-btn-${post.id}">
                    <svg class="w-5 h-5" ${post.liked_by_me ? 'fill="currentColor"' : 'fill="none"'} stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
                    </svg>
                    <span id="likes-count-${post.id}">${post.likes_count || 0}</span>
                </button>
                <button onclick="toggleComments(${post.id})" class="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                    </svg>
                    <span id="comments-count-${post.id}">${post.comments_count || 0}</span>
                </button>
            </div>

            <!-- Comments Section (hidden by default) -->
            <div class="comment-section mt-4" id="comments-section-${post.id}">
                <div class="border-t border-gray-800 pt-4">
                    <div id="comments-list-${post.id}" class="space-y-3 mb-3"></div>
                    ${user ? `
                        <div class="flex gap-2">
                            <input type="text" id="comment-input-${post.id}"
                                class="flex-1 bg-[#0f0f0f] border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-white/20 focus:outline-none"
                                placeholder="Yorum yaz..."
                                onkeydown="if(event.key==='Enter')addComment(${post.id})">
                            <button onclick="addComment(${post.id})"
                                class="bg-[#252525] hover:bg-[#333] text-white px-4 py-2 rounded-xl text-sm font-medium border border-gray-700 transition-all">
                                Gönder
                            </button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
}

// Submit new post
async function submitPost() {
    const content = document.getElementById('post-content').value.trim();
    if (!content) return showToast('Boş gönderi paylaşamazsın.', 'error');

    try {
        const resp = await fetch(`${API_URL}/community/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ content, category: selectedCategory })
        });

        if (resp.status === 401) {
            Auth.logout();
            return;
        }

        if (resp.ok) {
            document.getElementById('post-content').value = '';
            currentPage = 1;
            loadPosts();
            showToast('Gönderi paylaşıldı!', 'success');
        } else {
            const data = await resp.json();
            showToast(data.message || 'Paylaşım başarısız.', 'error');
        }
    } catch (e) {
        showToast('Bir hata oluştu.', 'error');
    }
}

// Delete post
async function deletePost(id) {
    if (!confirm('Bu gönderiyi silmek istediğine emin misin?')) return;

    try {
        const resp = await fetch(`${API_URL}/community/posts/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });

        if (resp.ok) {
            document.getElementById(`post-${id}`).remove();
            showToast('Gönderi silindi.', 'success');
        }
    } catch (e) {
        showToast('Silme başarısız.', 'error');
    }
}

// Toggle like
async function toggleLike(postId) {
    if (!Auth.getToken()) return showToast('Beğenmek için giriş yap.', 'error');

    try {
        const resp = await fetch(`${API_URL}/community/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });

        if (resp.ok) {
            const data = await resp.json();
            const btn = document.getElementById(`like-btn-${postId}`);
            const countEl = document.getElementById(`likes-count-${postId}`);

            countEl.textContent = data.likes_count;
            if (data.liked) {
                btn.classList.add('liked');
                btn.querySelector('svg').setAttribute('fill', 'currentColor');
            } else {
                btn.classList.remove('liked');
                btn.querySelector('svg').setAttribute('fill', 'none');
            }
        }
    } catch (e) {
        console.error('Like failed:', e);
    }
}

// Toggle comments section
async function toggleComments(postId) {
    const section = document.getElementById(`comments-section-${postId}`);
    const isOpen = section.classList.contains('open');

    if (isOpen) {
        section.classList.remove('open');
        return;
    }

    section.classList.add('open');
    await loadComments(postId);
}

// Load comments for a post
async function loadComments(postId) {
    const list = document.getElementById(`comments-list-${postId}`);
    list.innerHTML = '<div class="text-center text-gray-500 text-xs py-2">Yükleniyor...</div>';

    try {
        const resp = await fetch(`${API_URL}/community/posts/${postId}/comments`);
        const comments = await resp.json();

        if (comments.length === 0) {
            list.innerHTML = '<p class="text-gray-600 text-xs text-center py-2">Henüz yorum yok.</p>';
            return;
        }

        const user = Auth.getUser();
        list.innerHTML = comments.map(c => {
            const cAvatar = c.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`;
            const isOwner = user && user.id === c.user_id;
            return `
                <div class="flex items-start gap-2 group" id="comment-${c.id}">
                    <a href="profile.html?username=${c.username}">
                        <img src="${cAvatar}" class="w-7 h-7 rounded-full bg-[#252525] border border-gray-700 object-cover flex-shrink-0">
                    </a>
                    <div class="flex-1 bg-[#0f0f0f] rounded-xl px-3 py-2">
                        <div class="flex items-center justify-between">
                            <a href="profile.html?username=${c.username}" class="text-white text-xs font-semibold hover:underline">${c.username}</a>
                            <div class="flex items-center gap-2">
                                <span class="text-gray-600 text-xs">${getTimeAgo(new Date(c.created_at))}</span>
                                ${isOwner ? `
                                    <button onclick="deleteComment(${c.id}, ${postId})" class="text-gray-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                ` : ''}
                            </div>
                        </div>
                        <p class="text-gray-300 text-xs mt-0.5">${escapeHtml(c.content)}</p>
                    </div>
                </div>
            `;
        }).join('');
    } catch (e) {
        list.innerHTML = '<p class="text-red-400 text-xs text-center py-2">Yorumlar yüklenemedi.</p>';
    }
}

// Add comment
async function addComment(postId) {
    const input = document.getElementById(`comment-input-${postId}`);
    const content = input.value.trim();
    if (!content) return;

    try {
        const resp = await fetch(`${API_URL}/community/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Auth.getToken()}`
            },
            body: JSON.stringify({ content })
        });

        if (resp.ok) {
            input.value = '';
            await loadComments(postId);
            const data = await resp.json();
            document.getElementById(`comments-count-${postId}`).textContent = data.comments_count;
        }
    } catch (e) {
        showToast('Yorum gönderilemedi.', 'error');
    }
}

// Delete comment
async function deleteComment(commentId, postId) {
    try {
        const resp = await fetch(`${API_URL}/community/comments/${commentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${Auth.getToken()}` }
        });

        if (resp.ok) {
            const data = await resp.json();
            document.getElementById(`comment-${commentId}`).remove();
            document.getElementById(`comments-count-${postId}`).textContent = data.comments_count;
        }
    } catch (e) {
        showToast('Yorum silinemedi.', 'error');
    }
}

// Utility: Time ago
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    if (seconds < 60) return 'az önce';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}dk önce`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}sa önce`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}g önce`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}ay önce`;
    return `${Math.floor(months / 12)}yıl önce`;
}

// Utility: Escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
