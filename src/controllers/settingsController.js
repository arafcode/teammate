const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Get user settings (creates defaults if not exists)
exports.getSettings = async (req, res) => {
    try {
        const userId = req.user.id;

        // Get user info
        const [users] = await db.execute(
            'SELECT id, username, email, city, gender, birth_date, created_at FROM users WHERE id = ?',
            [userId]
        );
        if (!users.length) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        // Get or create settings
        let [settings] = await db.execute('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
        if (!settings.length) {
            await db.execute('INSERT INTO user_settings (user_id) VALUES (?)', [userId]);
            [settings] = await db.execute('SELECT * FROM user_settings WHERE user_id = ?', [userId]);
        }

        res.json({
            user: users[0],
            settings: settings[0]
        });
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Update account info (username, email)
exports.updateAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { username, email } = req.body;

        if (!username || !email) {
            return res.status(400).json({ message: 'Kullanıcı adı ve e-posta zorunludur.' });
        }

        // Check if username taken by another user
        const [existingUsername] = await db.execute(
            'SELECT id FROM users WHERE username = ? AND id != ?', [username, userId]
        );
        if (existingUsername.length) {
            return res.status(400).json({ message: 'Bu kullanıcı adı zaten kullanımda.' });
        }

        // Check if email taken by another user
        const [existingEmail] = await db.execute(
            'SELECT id FROM users WHERE email = ? AND id != ?', [email, userId]
        );
        if (existingEmail.length) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda.' });
        }

        await db.execute('UPDATE users SET username = ?, email = ? WHERE id = ?', [username, email, userId]);

        res.json({ message: 'Hesap bilgileri güncellendi.', user: { username, email } });
    } catch (error) {
        console.error('Update Account Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Change password
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.id;
        const { current_password, new_password } = req.body;

        if (!current_password || !new_password) {
            return res.status(400).json({ message: 'Mevcut şifre ve yeni şifre zorunludur.' });
        }

        if (new_password.length < 6) {
            return res.status(400).json({ message: 'Yeni şifre en az 6 karakter olmalıdır.' });
        }

        // Verify current password
        const [users] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (!users.length) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        const isMatch = await bcrypt.compare(current_password, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mevcut şifre yanlış.' });
        }

        const salt = await bcrypt.genSalt(10);
        const newHash = await bcrypt.hash(new_password, salt);
        await db.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, userId]);

        res.json({ message: 'Şifre başarıyla değiştirildi.' });
    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Update notification settings
exports.updateNotifications = async (req, res) => {
    try {
        const userId = req.user.id;
        const { notify_messages, notify_comments, notify_listings } = req.body;

        // Upsert
        await db.execute(`
            INSERT INTO user_settings (user_id, notify_messages, notify_comments, notify_listings)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                notify_messages = VALUES(notify_messages),
                notify_comments = VALUES(notify_comments),
                notify_listings = VALUES(notify_listings)
        `, [userId, notify_messages ?? true, notify_comments ?? true, notify_listings ?? true]);

        res.json({ message: 'Bildirim ayarları güncellendi.' });
    } catch (error) {
        console.error('Update Notifications Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Update privacy settings
exports.updatePrivacy = async (req, res) => {
    try {
        const userId = req.user.id;
        const { privacy_show_online, privacy_show_city, privacy_show_interests, privacy_profile_public } = req.body;

        await db.execute(`
            INSERT INTO user_settings (user_id, privacy_show_online, privacy_show_city, privacy_show_interests, privacy_profile_public)
            VALUES (?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                privacy_show_online = VALUES(privacy_show_online),
                privacy_show_city = VALUES(privacy_show_city),
                privacy_show_interests = VALUES(privacy_show_interests),
                privacy_profile_public = VALUES(privacy_profile_public)
        `, [userId, privacy_show_online ?? true, privacy_show_city ?? true, privacy_show_interests ?? true, privacy_profile_public ?? true]);

        res.json({ message: 'Gizlilik ayarları güncellendi.' });
    } catch (error) {
        console.error('Update Privacy Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

// Delete account
exports.deleteAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Hesap silmek için şifrenizi girin.' });
        }

        // Verify password
        const [users] = await db.execute('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (!users.length) return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });

        const isMatch = await bcrypt.compare(password, users[0].password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Şifre yanlış.' });
        }

        // Delete user (CASCADE will handle settings, interests, comments)
        await db.execute('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Hesabınız başarıyla silindi.' });
    } catch (error) {
        console.error('Delete Account Error:', error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
