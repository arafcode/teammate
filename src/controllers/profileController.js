const db = require('../config/db');

// Get Profile (Public)
exports.getProfile = async (req, res) => {
    try {
        const username = req.params.username;
        const [users] = await db.execute(
            'SELECT id, username, email, avatar_url, city, bio, social_links, availability_status, created_at FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = users[0];

        // Fetch Interests
        const [interests] = await db.execute(
            'SELECT * FROM user_interests WHERE user_id = ? ORDER BY category, name',
            [user.id]
        );

        // Fetch Comments
        const [comments] = await db.execute(`
            SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
            FROM profile_comments c
            JOIN users u ON c.author_user_id = u.id
            WHERE c.profile_user_id = ?
            ORDER BY c.created_at DESC
        `, [user.id]);

        // Fetch Stats (Listing Count)
        const [listingStats] = await db.execute(
            'SELECT COUNT(*) as count FROM listings WHERE user_id = ?',
            [user.id]
        );

        res.json({
            user: user,
            interests: interests,
            comments: comments,
            stats: {
                listings: listingStats[0].count
            }
        });

    } catch (error) {
        console.error('Get Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update Profile (Private) - Partial update: only updates provided fields
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const { bio, city, avatar_url, social_links, availability_status } = req.body;

        const updates = [];
        const values = [];

        if (bio !== undefined) { updates.push('bio = ?'); values.push(bio || null); }
        if (city !== undefined) { updates.push('city = ?'); values.push(city || null); }
        if (avatar_url !== undefined) { updates.push('avatar_url = ?'); values.push(avatar_url || null); }
        if (social_links !== undefined) { updates.push('social_links = ?'); values.push(JSON.stringify(social_links)); }
        if (availability_status !== undefined) { updates.push('availability_status = ?'); values.push(availability_status); }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update.' });
        }

        values.push(userId);
        await db.execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update Profile Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add Interest (Private)
exports.addInterest = async (req, res) => {
    try {
        const userId = req.user.id;
        const { category, name, metadata } = req.body;

        await db.execute(
            'INSERT INTO user_interests (user_id, category, name, metadata) VALUES (?, ?, ?, ?)',
            [userId, category, name, JSON.stringify(metadata || [])]
        );

        res.json({ message: 'Interest added' });
    } catch (error) {
        console.error('Add Interest Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove Interest (Private)
exports.removeInterest = async (req, res) => {
    try {
        const userId = req.user.id;
        const interestId = req.params.id;

        await db.execute(
            'DELETE FROM user_interests WHERE id = ? AND user_id = ?',
            [interestId, userId]
        );

        res.json({ message: 'Interest removed' });
    } catch (error) {
        console.error('Remove Interest Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Add Comment (Private)
exports.addComment = async (req, res) => {
    try {
        const authorId = req.user.id;
        const { profile_username, content } = req.body;

        // Find profile user id
        const [users] = await db.execute('SELECT id FROM users WHERE username = ?', [profile_username]);
        if (users.length === 0) return res.status(404).json({ message: 'User not found' });

        const profileId = users[0].id;

        await db.execute(
            'INSERT INTO profile_comments (profile_user_id, author_user_id, content) VALUES (?, ?, ?)',
            [profileId, authorId, content]
        );

        res.json({ message: 'Comment added' });

    } catch (error) {
        console.error('Add Comment Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete Comment (Owner Only)
exports.deleteComment = async (req, res) => {
    try {
        const userId = req.user.id; // The profile owner
        const commentId = req.params.id;

        // Verify ownership of the profile where the comment is located
        const [comments] = await db.execute(
            'SELECT * FROM profile_comments WHERE id = ? AND profile_user_id = ?',
            [commentId, userId]
        );

        if (comments.length === 0) {
            // Also allow author to delete their own comment?
            // Let's implement: Profile Owner OR Comment Author can delete
            const [authorCheck] = await db.execute(
                'SELECT * FROM profile_comments WHERE id = ? AND author_user_id = ?',
                [commentId, userId]
            );
            if (authorCheck.length === 0) {
                return res.status(403).json({ message: 'Not authorized' });
            }
        }

        await db.execute('DELETE FROM profile_comments WHERE id = ?', [commentId]);
        res.json({ message: 'Comment deleted' });

    } catch (error) {
        console.error('Delete Comment Error:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
