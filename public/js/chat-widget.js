// Global Chat Widget
// Facebook-style chat at bottom right

(function () {
    const API_URL = window.API_URL || '/api';

    const ChatWidget = {
        isOpen: false,
        isExpanded: false,
        activeConversationId: null,
        pollInterval: null,
        conversations: [],

        init() {
            if (document.getElementById('global-chat-widget')) return;
            this.injectHTML();
            this.setupEventListeners();
            this.startPolling();
        },

        injectHTML() {
            const html = `
                <div id="global-chat-widget" class="fixed bottom-0 right-4 z-[9999] flex flex-col items-end pointer-events-none">
                    <!-- Chat Window -->
                    <div id="chat-window" class="pointer-events-auto hidden bg-[#1e1e1e] border border-gray-700 rounded-t-xl shadow-2xl w-80 h-96 flex flex-col transition-all duration-300 transform translate-y-0">
                        <!-- Header -->
                        <div id="chat-header" class="flex items-center justify-between p-3 bg-[#252525] border-b border-gray-700 rounded-t-xl cursor-pointer hover:bg-[#2a2a2a]">
                            <div class="flex items-center gap-2">
                                <span class="text-white font-bold text-sm">💬 Mesajlar</span>
                                <span id="chat-badge" class="hidden bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full"></span>
                            </div>
                            <div class="flex items-center gap-2">
                                <button id="btn-minimize-chat" class="text-gray-400 hover:text-white p-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                                </button>
                                <button id="btn-close-chat" class="text-gray-400 hover:text-white p-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                        </div>

                        <!-- Conversation List -->
                        <div id="chat-list" class="flex-1 overflow-y-auto p-2 space-y-1">
                            <div class="text-center text-gray-500 text-xs py-4">Yükleniyor...</div>
                        </div>

                        <!-- Single Conversation View -->
                        <div id="chat-thread" class="hidden flex-1 flex flex-col h-full bg-[#1e1e1e]">
                             <div class="flex items-center gap-2 p-2 bg-[#252525] border-b border-gray-700">
                                <button id="btn-back-to-list" class="text-gray-400 hover:text-white p-1">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
                                </button>
                                <span id="chat-thread-title" class="text-white text-xs font-bold truncate flex-1">...</span>
                            </div>
                            <div id="chat-messages" class="flex-1 overflow-y-auto p-3 space-y-3 bg-[#151515] scrollbar-thin"></div>
                            <form id="chat-form" class="p-2 border-t border-gray-700 bg-[#252525]">
                                <div class="flex gap-2">
                                    <input type="text" id="chat-input" class="flex-1 bg-[#1a1a1a] border border-gray-600 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500" placeholder="Mesaj yaz..." autocomplete="off">
                                    <button type="submit" class="bg-blue-600 hover:bg-blue-500 text-white p-1.5 rounded-lg transition-colors">
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <!-- Collapsed Toggle Button -->
                <button id="chat-toggle-btn" class="pointer-events-auto bg-[#1e1e1e] hover:bg-[#2a2a2a] border border-gray-700 text-white p-3 rounded-full shadow-lg transition-all transform hover:scale-110 mb-5 mr-1 group">
                    <svg class="w-6 h-6 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path></svg>
                    <span id="chat-toggle-badge" class="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-[#1e1e1e] hidden"></span>
                </button>
                </div>
                <style>
                    #chat-messages::-webkit-scrollbar { width: 4px; }
                    #chat-messages::-webkit-scrollbar-track { background: #1a1a1a; }
                    #chat-messages::-webkit-scrollbar-thumb { background: #404040; border-radius: 2px; }
                    .chat-bubble-me { background: #2563eb; color: white; border-radius: 12px 12px 0 12px; margin-left: auto; }
                    .chat-bubble-other { background: #333; color: white; border-radius: 12px 12px 12px 0; margin-right: auto; }
                </style>
            `;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        setupEventListeners() {
            const toggleBtn = document.getElementById('chat-toggle-btn');
            const chatWindow = document.getElementById('chat-window');
            const header = document.getElementById('chat-header');
            const closeBtn = document.getElementById('btn-close-chat');
            const minimizeBtn = document.getElementById('btn-minimize-chat');
            const backBtn = document.getElementById('btn-back-to-list');
            const form = document.getElementById('chat-form');

            // Toggle Open/Close
            const toggleChat = () => {
                this.isOpen = !this.isOpen;
                if (this.isOpen) {
                    chatWindow.classList.remove('hidden');
                    toggleBtn.classList.add('hidden');
                    this.loadConversations();
                } else {
                    chatWindow.classList.add('hidden');
                    toggleBtn.classList.remove('hidden');
                }
            };

            toggleBtn.onclick = toggleChat;
            header.onclick = (e) => {
                if (e.target.closest('button')) return; // ignore buttons
                if (!this.isOpen) toggleChat(); // expand if minimized header (future)
            };
            closeBtn.onclick = toggleChat;
            minimizeBtn.onclick = toggleChat;

            backBtn.onclick = () => {
                document.getElementById('chat-thread').classList.add('hidden');
                document.getElementById('chat-list').classList.remove('hidden');
                this.activeConversationId = null;
                this.loadConversations();
            };

            form.onsubmit = async (e) => {
                e.preventDefault();
                const input = document.getElementById('chat-input');
                const content = input.value.trim();
                if (!content || !this.activeConversationId) return;

                // Optimistic UI
                this.renderMessage({ content, is_me: true, created_at: new Date().toISOString() }, true);
                input.value = '';

                try {
                    const parts = this.activeConversationId.split('-'); // user-listingId
                    const otherUserId = parts[0];
                    const listingId = parts[1];

                    const token = Auth.getToken();
                    const resp = await fetch(`${API_URL}/messages`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ receiver_id: otherUserId, listing_id: listingId, content })
                    });

                    if (resp.ok) {
                        this.loadThread(otherUserId, listingId, null, false); // Refresh to get real message
                    }
                } catch (err) {
                    console.error('Send message failed', err);
                }
            };
        },

        startPolling() {
            this.loadConversations();
            this.pollInterval = setInterval(() => {
                if (this.activeConversationId) {
                    const [uid, lid] = this.activeConversationId.split('-');
                    this.loadThread(uid, lid, null, false);
                } else {
                    this.loadConversations(true); // background update
                }
            }, 5000);
        },

        async loadConversations(isBackground = false) {
            if (!Auth.isAuthenticated()) return;
            try {
                const token = Auth.getToken();
                const resp = await fetch(`${API_URL}/messages?type=conversations`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await resp.json();
                this.conversations = data;

                if (!isBackground) this.renderConversationList();
                this.updateBadges();
            } catch (e) { console.error(e); }
        },

        renderConversationList() {
            const list = document.getElementById('chat-list');
            if (!this.conversations.length) {
                list.innerHTML = '<div class="text-center text-gray-500 text-xs py-4">Sohbet yok</div>';
                return;
            }

            const myId = Auth.getUser().id;

            list.innerHTML = this.conversations.map(c => {
                const isUnread = !c.is_read && c.sender_id !== myId;
                const avatar = c.other_user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.other_user_name}`;
                return `
                    <div class="flex items-center gap-3 p-2 rounded-lg hover:bg-[#333] cursor-pointer transition-colors ${isUnread ? 'bg-white/5' : ''}" 
                         onclick="ChatWidget.openThread('${c.other_user_id}', '${c.listing_id}', '${this.escapeHtml(c.other_user_name)}', '${this.escapeHtml(c.listing_title)}')">
                        <img src="${avatar}" class="w-8 h-8 rounded-full bg-[#202020]">
                        <div class="flex-1 min-w-0">
                            <div class="flex justify-between items-start">
                                <span class="text-white text-xs font-bold truncate">${this.escapeHtml(c.other_user_name)}</span>
                                <span class="text-[10px] text-gray-500">${this.timeAgoShort(c.created_at)}</span>
                            </div>
                            <p class="text-[10px] text-gray-400 truncate ${isUnread ? 'text-white font-medium' : ''}">${this.escapeHtml(c.content)}</p>
                        </div>
                        ${isUnread ? '<div class="w-2 h-2 bg-blue-500 rounded-full"></div>' : ''}
                    </div>
                `;
            }).join('');
        },

        async openThread(otherUserId, listingId, username, title) {
            this.activeConversationId = `${otherUserId}-${listingId}`;
            document.getElementById('chat-list').classList.add('hidden');
            document.getElementById('chat-thread').classList.remove('hidden');
            document.getElementById('chat-thread-title').textContent = `${username} • ${title}`;
            document.getElementById('chat-messages').innerHTML = '<div class="text-center text-gray-500 py-4 text-xs">Yükleniyor...</div>';

            await this.loadThread(otherUserId, listingId);
        },

        async loadThread(otherUserId, listingId, scroll = true) {
            try {
                const token = Auth.getToken();
                const resp = await fetch(`${API_URL}/messages?other_user_id=${otherUserId}&listing_id=${listingId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await resp.json();

                const container = document.getElementById('chat-messages');
                const wasAtBottom = container.scrollHeight - container.scrollTop === container.clientHeight;

                container.innerHTML = data.map(m => this.renderMessageHTML(m)).join('');

                if (scroll || wasAtBottom) container.scrollTop = container.scrollHeight;

                // Mark as read
                if (data.length > 0) {
                    await fetch(`${API_URL}/messages/read`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ sender_id: otherUserId, listing_id: listingId })
                    });
                }
            } catch (e) { console.error(e); }
        },

        renderMessageHTML(m) {
            const isMe = m.sender_id === Auth.getUser().id;
            return `
                <div class="flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-2">
                    <div class="max-w-[80%] px-3 py-2 text-xs ${isMe ? 'chat-bubble-me' : 'chat-bubble-other'}">
                        ${this.escapeHtml(m.content)}
                    </div>
                    <span class="text-[9px] text-gray-600 mt-0.5 px-1">${this.formatTime(m.created_at)}</span>
                </div>
            `;
        },

        // Optimistic render
        renderMessage(m, scroll) {
            const container = document.getElementById('chat-messages');
            container.insertAdjacentHTML('beforeend', this.renderMessageHTML(m));
            if (scroll) container.scrollTop = container.scrollHeight;
        },

        updateBadges() {
            const myId = Auth.getUser().id;
            const unreadCount = this.conversations.filter(c => !c.is_read && c.sender_id !== myId).length;

            const toggleBadge = document.getElementById('chat-toggle-badge');
            const headerBadge = document.getElementById('chat-badge');

            if (unreadCount > 0) {
                toggleBadge.classList.remove('hidden');
                headerBadge.textContent = unreadCount;
                headerBadge.classList.remove('hidden');
            } else {
                toggleBadge.classList.add('hidden');
                headerBadge.classList.add('hidden');
            }
        },

        escapeHtml(text) {
            if (!text) return '';
            return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
        },

        formatTime(dateStr) {
            return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        },

        timeAgoShort(dateStr) {
            const diff = (new Date() - new Date(dateStr)) / 1000;
            if (diff < 60) return 'şimdi';
            if (diff < 3600) return Math.floor(diff / 60) + 'd';
            if (diff < 86400) return Math.floor(diff / 3600) + 's';
            return Math.floor(diff / 86400) + 'g';
        }
    };

    // Expose Global
    window.ChatWidget = ChatWidget;

    // Initialize logic
    console.log('ChatWidget script executing...');
    if (typeof Auth !== 'undefined' && Auth.isAuthenticated()) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => ChatWidget.init());
        } else {
            // DOM already ready
            setTimeout(() => ChatWidget.init(), 100);
        }
    }

})();
