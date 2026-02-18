const db = require('../config/db');

// Get all groups (with search)
exports.getGroups = async (req, res) => {
    try {
        const { category, search } = req.query;
        let query = `
            SELECT g.*, u.username as creator_name,
                   (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
            FROM \`groups\` g
            JOIN users u ON g.creator_id = u.id
        `;
        const conditions = [];
        const params = [];

        if (category && category !== 'all') {
            conditions.push('g.category = ?');
            params.push(category);
        }
        if (search) {
            conditions.push('(g.name LIKE ? OR g.description LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += ' ORDER BY member_count DESC, g.created_at DESC';

        const [groups] = await db.execute(query, params);

        // Check membership for logged-in user
        const authHeader = req.header('Authorization');
        if (authHeader) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar');
                for (let g of groups) {
                    const [mem] = await db.execute(
                        'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
                        [g.id, decoded.id]
                    );
                    g.is_member = mem.length > 0;
                    g.my_role = mem.length > 0 ? mem[0].role : null;
                }
            } catch (e) { /* skip */ }
        }

        res.json(groups);
    } catch (error) {
        console.error('Get Groups Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Get single group detail
exports.getGroup = async (req, res) => {
    try {
        const groupId = req.params.id;
        const [groups] = await db.execute(
            `SELECT g.*, u.username as creator_name,
                    (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
             FROM \`groups\` g
             JOIN users u ON g.creator_id = u.id
             WHERE g.id = ?`,
            [groupId]
        );
        if (!groups.length) return res.status(404).json({ message: 'Grup bulunamadı.' });

        const group = groups[0];

        // Get members
        const [members] = await db.execute(
            `SELECT gm.role, gm.joined_at, u.id as user_id, u.username, u.avatar_url
             FROM group_members gm
             JOIN users u ON gm.user_id = u.id
             WHERE gm.group_id = ?
             ORDER BY gm.role DESC, gm.joined_at ASC`,
            [groupId]
        );
        group.members = members;

        // Check if requester is member
        const authHeader = req.header('Authorization');
        if (authHeader) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar');
                const [mem] = await db.execute(
                    'SELECT role FROM group_members WHERE group_id = ? AND user_id = ?',
                    [groupId, decoded.id]
                );
                group.is_member = mem.length > 0;
                group.my_role = mem.length > 0 ? mem[0].role : null;
            } catch (e) { /* skip */ }
        }

        res.json(group);
    } catch (error) {
        console.error('Get Group Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Create group
exports.createGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, description, category } = req.body;

        if (!name || !name.trim()) return res.status(400).json({ message: 'Grup adı zorunlu.' });

        const validCats = ['game', 'sport', 'other'];
        const cat = validCats.includes(category) ? category : 'game';

        // Generate avatar
        const avatarUrl = `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(name.trim())}`;

        const [result] = await db.execute(
            'INSERT INTO `groups` (name, description, category, avatar_url, creator_id) VALUES (?, ?, ?, ?, ?)',
            [name.trim(), description || '', cat, avatarUrl, userId]
        );

        // Auto-join creator as admin
        await db.execute(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [result.insertId, userId, 'admin']
        );

        res.status(201).json({ message: 'Grup oluşturuldu.', groupId: result.insertId });
    } catch (error) {
        console.error('Create Group Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Delete group (only creator)
exports.deleteGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.id;

        const [groups] = await db.execute('SELECT creator_id FROM `groups` WHERE id = ?', [groupId]);
        if (!groups.length) return res.status(404).json({ message: 'Grup bulunamadı.' });
        if (groups[0].creator_id !== userId) return res.status(403).json({ message: 'Sadece kurucu silebilir.' });

        await db.execute('DELETE FROM `groups` WHERE id = ?', [groupId]);
        res.json({ message: 'Grup silindi.' });
    } catch (error) {
        console.error('Delete Group Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Join group
exports.joinGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.id;

        const [existing] = await db.execute(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
        if (existing.length) return res.status(400).json({ message: 'Zaten üyesin.' });

        await db.execute(
            'INSERT INTO group_members (group_id, user_id, role) VALUES (?, ?, ?)',
            [groupId, userId, 'member']
        );

        const [count] = await db.execute('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?', [groupId]);
        res.json({ message: 'Gruba katıldın!', member_count: count[0].c });
    } catch (error) {
        console.error('Join Group Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Leave group
exports.leaveGroup = async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.id;

        // Check if creator
        const [groups] = await db.execute('SELECT creator_id FROM `groups` WHERE id = ?', [groupId]);
        if (groups.length && groups[0].creator_id === userId) {
            return res.status(400).json({ message: 'Kurucu gruptan ayrılamaz. Grubu silmelisin.' });
        }

        await db.execute('DELETE FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);

        const [count] = await db.execute('SELECT COUNT(*) as c FROM group_members WHERE group_id = ?', [groupId]);
        res.json({ message: 'Gruptan ayrıldın.', member_count: count[0].c });
    } catch (error) {
        console.error('Leave Group Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Get group posts
exports.getGroupPosts = async (req, res) => {
    try {
        const groupId = req.params.id;
        const [posts] = await db.execute(
            `SELECT gp.*, u.username, u.avatar_url
             FROM group_posts gp
             JOIN users u ON gp.user_id = u.id
             WHERE gp.group_id = ?
             ORDER BY gp.created_at DESC`,
            [groupId]
        );
        res.json(posts);
    } catch (error) {
        console.error('Get Group Posts Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Create group post (members only)
exports.createGroupPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const groupId = req.params.id;
        const { content } = req.body;

        if (!content || !content.trim()) return res.status(400).json({ message: 'İçerik boş olamaz.' });

        // Check membership
        const [mem] = await db.execute(
            'SELECT id FROM group_members WHERE group_id = ? AND user_id = ?',
            [groupId, userId]
        );
        if (!mem.length) return res.status(403).json({ message: 'Bu grubun üyesi değilsin.' });

        const [result] = await db.execute(
            'INSERT INTO group_posts (group_id, user_id, content) VALUES (?, ?, ?)',
            [groupId, userId, content.trim()]
        );

        const [posts] = await db.execute(
            `SELECT gp.*, u.username, u.avatar_url FROM group_posts gp JOIN users u ON gp.user_id = u.id WHERE gp.id = ?`,
            [result.insertId]
        );

        res.status(201).json(posts[0]);
    } catch (error) {
        console.error('Create Group Post Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Delete group post (owner or admin)
exports.deleteGroupPost = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id: groupId, postId } = req.params;

        const [posts] = await db.execute('SELECT user_id FROM group_posts WHERE id = ? AND group_id = ?', [postId, groupId]);
        if (!posts.length) return res.status(404).json({ message: 'Gönderi bulunamadı.' });

        // Allow deletion by post owner or group admin
        const [mem] = await db.execute('SELECT role FROM group_members WHERE group_id = ? AND user_id = ?', [groupId, userId]);
        const isAdmin = mem.length && mem[0].role === 'admin';
        const isOwner = posts[0].user_id === userId;

        if (!isOwner && !isAdmin) return res.status(403).json({ message: 'Bu gönderiyi silemezsin.' });

        await db.execute('DELETE FROM group_posts WHERE id = ?', [postId]);
        res.json({ message: 'Gönderi silindi.' });
    } catch (error) {
        console.error('Delete Group Post Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
