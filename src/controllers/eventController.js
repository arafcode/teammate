const db = require('../config/db');

// Get all events
exports.getEvents = async (req, res) => {
    try {
        const { category, time } = req.query;
        let query = `
            SELECT e.*, u.username as creator_name, u.avatar_url as creator_avatar,
                   (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
            FROM events e
            JOIN users u ON e.creator_id = u.id
        `;
        const conditions = [];
        const params = [];

        if (category && category !== 'all') {
            conditions.push('e.category = ?');
            params.push(category);
        }

        // Time filter: upcoming or past
        if (time === 'past') {
            conditions.push('e.event_date < NOW()');
        } else {
            conditions.push('e.event_date >= NOW()');
        }

        if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
        query += time === 'past' ? ' ORDER BY e.event_date DESC' : ' ORDER BY e.event_date ASC';

        const [events] = await db.execute(query, params);

        // Check participation for logged-in user
        const authHeader = req.header('Authorization');
        if (authHeader) {
            try {
                const jwt = require('jsonwebtoken');
                const token = authHeader.replace('Bearer ', '');
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar');
                for (let ev of events) {
                    const [p] = await db.execute(
                        'SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?',
                        [ev.id, decoded.id]
                    );
                    ev.joined = p.length > 0;
                }
            } catch (e) { /* skip */ }
        }

        res.json(events);
    } catch (error) {
        console.error('Get Events Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Get single event
exports.getEvent = async (req, res) => {
    try {
        const [events] = await db.execute(
            `SELECT e.*, u.username as creator_name, u.avatar_url as creator_avatar,
                    (SELECT COUNT(*) FROM event_participants WHERE event_id = e.id) as participant_count
             FROM events e JOIN users u ON e.creator_id = u.id WHERE e.id = ?`,
            [req.params.id]
        );
        if (!events.length) return res.status(404).json({ message: 'Etkinlik bulunamadı.' });

        const event = events[0];

        // Get participants
        const [participants] = await db.execute(
            `SELECT ep.joined_at, u.id as user_id, u.username, u.avatar_url
             FROM event_participants ep JOIN users u ON ep.user_id = u.id
             WHERE ep.event_id = ? ORDER BY ep.joined_at ASC`,
            [req.params.id]
        );
        event.participants = participants;

        res.json(event);
    } catch (error) {
        console.error('Get Event Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Create event
exports.createEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const { title, description, category, event_date, location, max_participants } = req.body;

        if (!title || !title.trim()) return res.status(400).json({ message: 'Başlık zorunlu.' });
        if (!event_date) return res.status(400).json({ message: 'Tarih zorunlu.' });

        const validCats = ['game', 'sport', 'other'];
        const cat = validCats.includes(category) ? category : 'game';
        const maxP = parseInt(max_participants) || 0;

        const [result] = await db.execute(
            'INSERT INTO events (title, description, category, event_date, location, max_participants, creator_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title.trim(), description || '', cat, event_date, location || '', maxP, userId]
        );

        // Auto-join creator
        await db.execute('INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)', [result.insertId, userId]);

        res.status(201).json({ message: 'Etkinlik oluşturuldu.', eventId: result.insertId });
    } catch (error) {
        console.error('Create Event Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Delete event (creator only)
exports.deleteEvent = async (req, res) => {
    try {
        const [events] = await db.execute('SELECT creator_id FROM events WHERE id = ?', [req.params.id]);
        if (!events.length) return res.status(404).json({ message: 'Etkinlik bulunamadı.' });
        if (events[0].creator_id !== req.user.id) return res.status(403).json({ message: 'Sadece oluşturan silebilir.' });

        await db.execute('DELETE FROM events WHERE id = ?', [req.params.id]);
        res.json({ message: 'Etkinlik silindi.' });
    } catch (error) {
        console.error('Delete Event Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Join event
exports.joinEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;

        // Check max participants
        const [events] = await db.execute('SELECT max_participants FROM events WHERE id = ?', [eventId]);
        if (!events.length) return res.status(404).json({ message: 'Etkinlik bulunamadı.' });

        const [existing] = await db.execute('SELECT id FROM event_participants WHERE event_id = ? AND user_id = ?', [eventId, userId]);
        if (existing.length) return res.status(400).json({ message: 'Zaten katıldın.' });

        if (events[0].max_participants > 0) {
            const [count] = await db.execute('SELECT COUNT(*) as c FROM event_participants WHERE event_id = ?', [eventId]);
            if (count[0].c >= events[0].max_participants) {
                return res.status(400).json({ message: 'Etkinlik dolu.' });
            }
        }

        await db.execute('INSERT INTO event_participants (event_id, user_id) VALUES (?, ?)', [eventId, userId]);
        const [count] = await db.execute('SELECT COUNT(*) as c FROM event_participants WHERE event_id = ?', [eventId]);
        res.json({ message: 'Katıldın!', participant_count: count[0].c });
    } catch (error) {
        console.error('Join Event Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Leave event
exports.leaveEvent = async (req, res) => {
    try {
        const userId = req.user.id;
        const eventId = req.params.id;

        const [events] = await db.execute('SELECT creator_id FROM events WHERE id = ?', [eventId]);
        if (events.length && events[0].creator_id === userId) {
            return res.status(400).json({ message: 'Oluşturan etkinlikten ayrılamaz. Etkinliği silmelisin.' });
        }

        await db.execute('DELETE FROM event_participants WHERE event_id = ? AND user_id = ?', [eventId, userId]);
        const [count] = await db.execute('SELECT COUNT(*) as c FROM event_participants WHERE event_id = ?', [eventId]);
        res.json({ message: 'Ayrıldın.', participant_count: count[0].c });
    } catch (error) {
        console.error('Leave Event Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
