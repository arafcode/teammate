const db = require('../config/db');

class Message {
    static async create({ sender_id, receiver_id, listing_id, content }) {
        const [result] = await db.execute(
            'INSERT INTO messages (sender_id, receiver_id, listing_id, content) VALUES (?, ?, ?, ?)',
            [sender_id, receiver_id, listing_id, content]
        );
        return result.insertId;
    }

    // Get list of conversations (latest message from each partner+listing)
    static async getConversations(userId) {
        // This query groups by the "other" user and listing, finding the most recent message ID
        // Then it joins back to messages table to get the content
        const query = `
            SELECT 
                m.id, m.sender_id, m.receiver_id, m.listing_id, m.content, m.is_read, m.created_at,
                u.username as other_user_name, u.avatar_url as other_user_avatar,
                l.title as listing_title
            FROM messages m
            JOIN (
                SELECT MAX(id) as max_id
                FROM messages
                WHERE sender_id = ? OR receiver_id = ?
                GROUP BY 
                    CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END,
                    listing_id
            ) latest ON m.id = latest.max_id
            JOIN users u ON u.id = (CASE WHEN m.sender_id = ? THEN m.receiver_id ELSE m.sender_id END)
            LEFT JOIN listings l ON m.listing_id = l.id
            ORDER BY m.created_at DESC
        `;
        const [rows] = await db.execute(query, [userId, userId, userId, userId]);
        return rows;
    }

    // Get specific thread messages
    static async getThread(userId, otherUserId, listingId = null) {
        let query = `
            SELECT 
                m.id, m.sender_id, m.receiver_id, m.listing_id, m.content, m.is_read, m.created_at,
                s.username as sender_name, s.avatar_url as sender_avatar,
                r.username as receiver_name, r.avatar_url as receiver_avatar
            FROM messages m
            JOIN users s ON m.sender_id = s.id
            JOIN users r ON m.receiver_id = r.id
            WHERE (
                (m.sender_id = ? AND m.receiver_id = ?) 
                OR 
                (m.sender_id = ? AND m.receiver_id = ?)
            )
        `;

        const params = [userId, otherUserId, otherUserId, userId];

        if (listingId) {
            query += ` AND m.listing_id = ?`;
            params.push(listingId);
        } else {
            // If no listing ID is mostly for general DMs, but if we want to include ALL messages between two users regardless of listing:
            // query += ` AND m.listing_id IS NULL`; // Optional: decide if contexts are strictly separated
            // For now, let's keep it context-aware if listingId is provided, otherwise fetch all?
            // Actually, user wants "listing specific", so let's stick to context if possible. 
        }

        query += ` ORDER BY m.created_at ASC`;

        const [rows] = await db.execute(query, params);
        return rows;
    }

    static async markAsRead(userId, otherUserId, listingId) {
        let query = `
            UPDATE messages 
            SET is_read = TRUE 
            WHERE receiver_id = ? AND sender_id = ?
        `;
        const params = [userId, otherUserId];

        if (listingId) {
            query += ` AND listing_id = ?`;
            params.push(listingId);
        }

        await db.execute(query, params);
    }
}

module.exports = Message;
