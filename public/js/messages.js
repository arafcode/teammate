console.log('Messages script loaded');

// State
let conversations = [];
let activeThread = null; // { otherUserId, listingId, listingTitle, otherUserAvatar, otherUserName }
let refreshTimer = null;

// Auth Check
document.addEventListener('DOMContentLoaded', () => {
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        window.location.href = 'login.html?redirect=messages.html';
        return;
    }

    // Initial Load
    fetchConversations();

    // Auto Refresh every 10s
    refreshTimer = setInterval(fetchConversations, 10000);

    // Refresh Button
    document.getElementById('btn-refresh')?.addEventListener('click', () => {
        fetchConversations();
        if (activeThread) loadThread(activeThread.otherUserId, activeThread.listingId);
    });

    // Back to list (Mobile)
    document.getElementById('back-to-list')?.addEventListener('click', () => {
        document.querySelector('aside').classList.remove('hidden');
        document.getElementById('chat-area').classList.add('hidden', 'md:flex');
        activeThread = null;
    });

    // Form Submit
    document.getElementById('message-form')?.addEventListener('submit', sendMessage);
});

async function fetchConversations() {
    try {
        const token = Auth.getToken();
        const response = await fetch('/api/messages?type=conversations', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to fetch conversations');

        const data = await response.json();
        conversations = data;
        renderConversations();
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

function renderConversations() {
    const list = document.getElementById('conversations-list');
    const totalUnreadBadge = document.getElementById('total-unread');

    list.innerHTML = '';

    let unreadCount = 0;

    if (conversations.length === 0) {
        list.innerHTML = '<div class="text-gray-500 text-left text-sm p-4">Henüz mesajınız yok.</div>';
        return;
    }

    conversations.forEach(conv => {
        const isUnread = !conv.is_read && conv.sender_id !== Auth.getUser().id; // Assuming current user logic
        if (isUnread) unreadCount++;

        const isActive = activeThread &&
            activeThread.otherUserId === (conv.sender_id === Auth.getUser().id ? conv.receiver_id : conv.sender_id) &&
            activeThread.listingId === conv.listing_id;

        const otherUserId = conv.sender_id === Auth.getUser().id ? conv.receiver_id : conv.sender_id;
        const otherUserName = conv.other_user_name || 'Kullanıcı';
        const otherUserAvatar = conv.other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserName}`;
        const listingTitle = conv.listing_title || 'Genel Sohbet';

        const div = document.createElement('div');
        div.className = `p-3 rounded-xl cursor-pointer transition-colors flex gap-3 items-center group relative ${isActive ? 'bg-blue-600/20 border border-blue-600/30' : 'hover:bg-[#252525] border border-transparent'}`;
        div.onclick = () => selectConversation(otherUserId, conv.listing_id, otherUserName, otherUserAvatar, listingTitle);

        div.innerHTML = `
            <img src="${otherUserAvatar}" class="w-10 h-10 rounded-full bg-gray-700 object-cover flex-shrink-0">
            <div class="flex-1 min-w-0">
                <div class="flex justify-between items-baseline">
                    <h4 class="text-sm font-bold text-gray-200 truncate ${isUnread ? 'text-white' : ''}">${otherUserName}</h4>
                    <span class="text-[10px] text-gray-500">${timeAgoShort(conv.created_at)}</span>
                </div>
                <p class="text-xs text-blue-400 truncate mb-0.5">${listingTitle}</p>
                <p class="text-xs text-gray-400 truncate ${isUnread ? 'font-semibold text-gray-200' : ''}">
                    ${conv.sender_id === Auth.getUser().id ? 'Siz: ' : ''}${conv.content}
                </p>
            </div>
            ${isUnread ? '<div class="absolute right-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg shadow-blue-500/50"></div>' : ''}
        `;
        list.appendChild(div);
    });

    if (unreadCount > 0) {
        totalUnreadBadge.textContent = unreadCount;
        totalUnreadBadge.classList.remove('hidden');
    } else {
        totalUnreadBadge.classList.add('hidden');
    }
}

function selectConversation(otherUserId, listingId, username, avatar, title) {
    activeThread = { otherUserId, listingId, listingTitle: title, otherUserName: username, otherUserAvatar: avatar };

    // Mobile View Toggle
    document.querySelector('aside').classList.add('hidden', 'md:flex');
    document.getElementById('chat-area').classList.remove('hidden');
    document.getElementById('chat-area').classList.add('flex');

    // Update Header
    document.getElementById('empty-state').classList.add('hidden');
    document.getElementById('chat-header').classList.remove('hidden');
    document.getElementById('messages-container').classList.remove('hidden');
    document.getElementById('chat-input-area').classList.remove('hidden');

    document.getElementById('chat-username').textContent = username;
    document.getElementById('chat-avatar').src = avatar;
    document.getElementById('chat-context').innerHTML = `<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path></svg> ${title}`;

    loadThread(otherUserId, listingId);

    // Optimistic read status update
    fetchConversations();
}

async function loadThread(otherUserId, listingId) {
    const container = document.getElementById('messages-container');
    // Keep scroll position if refreshing? For now, simplistic scroll to bottom logic

    try {
        const token = Auth.getToken();
        const response = await fetch(`/api/messages?type=thread&other_user_id=${otherUserId}&listing_id=${listingId || ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Failed to load thread');

        const messages = await response.json();
        renderMessages(messages);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

    } catch (error) {
        console.error(error);
    }
}

function renderMessages(messages) {
    const container = document.getElementById('messages-container');
    container.innerHTML = '';

    const currentUserId = Auth.getUser().id;

    messages.forEach(msg => {
        const isMe = msg.sender_id === currentUserId;

        const div = document.createElement('div');
        div.className = `flex justify-start mb-2`; // Always left aligned

        div.innerHTML = `
            <div class="max-w-[85%] rounded-xl px-4 py-3 text-sm relative group ${isMe
                ? 'bg-blue-600/20 text-blue-100 border border-blue-500/30'
                : 'bg-[#252525] text-gray-200 border border-gray-700'
            }">
                <p class="text-xs font-bold mb-1 ${isMe ? 'text-blue-400' : 'text-gray-400'}">
                    ${isMe ? 'Siz' : (activeThread.otherUserName || 'Kullanıcı')}
                </p>
                <p class="whitespace-pre-wrap leading-relaxed">${escapeHtml(msg.content)}</p>
                <div class="text-[10px] mt-2 opacity-60 text-right flex items-center justify-end gap-1">
                    ${formatTime(msg.created_at)}
                    ${isMe ? (msg.is_read ? '<span class="text-blue-400">✓✓</span>' : '<span>✓</span>') : ''}
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

async function sendMessage(e) {
    e.preventDefault();
    if (!activeThread) return;

    const input = document.getElementById('message-input');
    const content = input.value.trim();
    if (!content) return;

    try {
        input.value = ''; // Clear immediately

        const token = Auth.getToken();
        const response = await fetch('/api/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                receiver_id: activeThread.otherUserId,
                listing_id: activeThread.listingId,
                content: content
            })
        });

        if (response.ok) {
            loadThread(activeThread.otherUserId, activeThread.listingId);
            fetchConversations(); // Update side list preview
        }
    } catch (error) {
        console.error('Send error:', error);
        alert('Mesaj gönderilemedi.');
    }
}

// Utils
function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

function timeAgoShort(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = (now - date) / 1000;

    if (diff < 60) return 'şimdi';
    if (diff < 3600) return Math.floor(diff / 60) + 'dk';
    if (diff < 86400) return Math.floor(diff / 3600) + 'sa';
    return Math.floor(diff / 86400) + 'g';
}
