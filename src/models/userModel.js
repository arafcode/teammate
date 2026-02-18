const db = require('../config/db');

class User {
    static async create(userData) {
        const { username, email, password_hash, city, gender, birth_date } = userData;
        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, city, gender, birth_date) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, password_hash, city || null, gender || null, birth_date || null]
        );
        return result.insertId;
    }

    static async findByEmail(email) {
        const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
        return rows[0];
    }

    static async findById(id) {
        const [rows] = await db.execute('SELECT id, username, email, avatar_url, bio, city, gender, birth_date, created_at FROM users WHERE id = ?', [id]);
        return rows[0];
    }
}

module.exports = User;
