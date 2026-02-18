const db = require('../config/db');

// Get all posts (with pagination and category filter)
exports.getPosts = async (req, res) => {
    try {
        const { category, page = 1, username } = req.query;
        const limit = 20;
        const offset = (parseInt(page) - 1) * limit;

        let query = `
            SELECT p.*, u.username, u.avatar_url,
                   (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
                   (SELECT COUNT(*) FROM post_comments WHERE post_id = p.id) as comments_count
            FROM community_posts p
            JOIN users u ON p.user_id = u.id
        `;
        const params = [];
        const conditions = [];

        if (category && category !== 'all') {
            conditions.push('p.category = ?');
            params.push(category);
        }
        if (username) {
            conditions.push('u.username = ?');
            params.push(username);
        }

        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');

        query += ` ORDER BY p.created_at DESC LIMIT ${limit} OFFSET ${offset}`;

        const [posts] = await db.execute(query, params);

        // Check if current user liked each post
        const authHeader = req.header('Authorization');
        if (authHeader) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar');
                const userId = decoded.id;

                for (let post of posts) {
                    const [likes] = await db.execute(
                        'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
                        [post.id, userId]
                    );
                    post.liked_by_me = likes.length > 0;
                }
            } catch (e) { /* token invalid, skip */ }
        }

        res.json(posts);
    } catch (error) {
        console.error('Get Posts Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Create a post
exports.createPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { content, category } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'İçerik boş olamaz.' });
        }

        const validCategories = ['general', 'game', 'sport', 'question'];
        const cat = validCategories.includes(category) ? category : 'general';

        const [result] = await db.execute(
            'INSERT INTO community_posts (user_id, content, category) VALUES (?, ?, ?)',
            [userId, content.trim(), cat]
        );

        // Return the created post with user info
        const [posts] = await db.execute(
            `SELECT p.*, u.username, u.avatar_url FROM community_posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?`,
            [result.insertId]
        );

        res.status(201).json(posts[0]);
    } catch (error) {
        console.error('Create Post Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Delete a post
exports.deletePost = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        const [posts] = await db.execute('SELECT user_id FROM community_posts WHERE id = ?', [postId]);
        if (!posts.length) return res.status(404).json({ message: 'Gönderi bulunamadı.' });
        if (posts[0].user_id !== userId) return res.status(403).json({ message: 'Bu gönderiyi silemezsin.' });

        await db.execute('DELETE FROM community_posts WHERE id = ?', [postId]);
        res.json({ message: 'Gönderi silindi.' });
    } catch (error) {
        console.error('Delete Post Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Toggle like on a post
exports.toggleLike = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;

        // Check if already liked
        const [existing] = await db.execute(
            'SELECT id FROM post_likes WHERE post_id = ? AND user_id = ?',
            [postId, userId]
        );

        if (existing.length > 0) {
            // Unlike
            await db.execute('DELETE FROM post_likes WHERE post_id = ? AND user_id = ?', [postId, userId]);
            const [count] = await db.execute('SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?', [postId]);
            res.json({ liked: false, likes_count: count[0].c });
        } else {
            // Like
            await db.execute('INSERT INTO post_likes (post_id, user_id) VALUES (?, ?)', [postId, userId]);
            const [count] = await db.execute('SELECT COUNT(*) as c FROM post_likes WHERE post_id = ?', [postId]);
            res.json({ liked: true, likes_count: count[0].c });
        }
    } catch (error) {
        console.error('Toggle Like Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Get comments for a post
exports.getComments = async (req, res) => {
    try {
        const postId = req.params.id;
        const [comments] = await db.execute(
            `SELECT c.*, u.username, u.avatar_url
             FROM post_comments c
             JOIN users u ON c.user_id = u.id
             WHERE c.post_id = ?
             ORDER BY c.created_at ASC`,
            [postId]
        );
        res.json(comments);
    } catch (error) {
        console.error('Get Comments Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Add a comment
exports.addComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const postId = req.params.id;
        const { content } = req.body;

        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Yorum boş olamaz.' });
        }

        const [result] = await db.execute(
            'INSERT INTO post_comments (post_id, user_id, content) VALUES (?, ?, ?)',
            [postId, userId, content.trim()]
        );

        // Return comment with user info
        const [comments] = await db.execute(
            `SELECT c.*, u.username, u.avatar_url FROM post_comments c JOIN users u ON c.user_id = u.id WHERE c.id = ?`,
            [result.insertId]
        );

        // Update comment count
        const [count] = await db.execute('SELECT COUNT(*) as c FROM post_comments WHERE post_id = ?', [postId]);

        res.status(201).json({ comment: comments[0], comments_count: count[0].c });
    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
    try {
        const userId = req.user.id;
        const commentId = req.params.commentId;

        const [comments] = await db.execute('SELECT user_id, post_id FROM post_comments WHERE id = ?', [commentId]);
        if (!comments.length) return res.status(404).json({ message: 'Yorum bulunamadı.' });
        if (comments[0].user_id !== userId) return res.status(403).json({ message: 'Bu yorumu silemezsin.' });

        await db.execute('DELETE FROM post_comments WHERE id = ?', [commentId]);

        const postId = comments[0].post_id;
        const [count] = await db.execute('SELECT COUNT(*) as c FROM post_comments WHERE post_id = ?', [postId]);

        res.json({ message: 'Yorum silindi.', comments_count: count[0].c });
    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
