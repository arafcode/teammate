const Message = require('../models/messageModel');
const Listing = require('../models/listingModel');

exports.sendMessage = async (req, res) => {
    try {
        const { receiver_id, listing_id, content } = req.body;
        const sender_id = req.user.id; // From authMiddleware

        if (!receiver_id || !content) {
            return res.status(400).json({ message: 'Alıcı ve mesaj içeriği zorunludur.' });
        }

        if (sender_id == receiver_id) {
            return res.status(400).json({ message: 'Kendinize mesaj atamazsınız.' });
        }

        const messageId = await Message.create({ sender_id, receiver_id, listing_id, content });

        res.status(201).json({ message: 'Mesaj gönderildi.', messageId });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ message: 'Mesaj gönderilemedi.' });
    }
};

exports.getMessages = async (req, res) => {
    try {
        const { type, other_user_id, listing_id } = req.query;
        const userId = req.user.id;

        if (type === 'thread') {
            if (!other_user_id) {
                return res.status(400).json({ message: 'other_user_id gereklidir.' });
            }
            const messages = await Message.getThread(userId, other_user_id, listing_id);

            // Mark as read when fetching thread
            await Message.markAsRead(userId, other_user_id, listing_id);

            return res.json(messages);
        }

        // Default to conversations list
        const conversations = await Message.getConversations(userId);
        res.json(conversations);

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ message: 'Mesajlar alınamadı.' });
    }
};

exports.markRead = async (req, res) => {
    try {
        const { other_user_id, listing_id } = req.body;
        await Message.markAsRead(req.user.id, other_user_id, listing_id);
        res.json({ success: true });
    } catch (error) {
        console.error('Mark read error:', error);
        res.status(500).json({ message: 'İşlem başarısız.' });
    }
};
