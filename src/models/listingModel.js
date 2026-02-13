const db = require('../config/db');

class Listing {
    static async create(listingData) {
        const { user_id, category_id, title, description, activity_date, expiry_date, location, max_participants } = listingData;

        // Helper to format Date to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
        const formatDate = (dateStr) => {
            const d = new Date(dateStr);
            return d.toISOString().slice(0, 19).replace('T', ' ');
        };

        const [result] = await db.execute(
            `INSERT INTO listings 
      (user_id, category_id, title, description, activity_date, expiry_date, location, max_participants) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [user_id, category_id, title, description, formatDate(activity_date), formatDate(expiry_date), location, max_participants]
        );
        return result.insertId;
    }

    static async findAll() {
        const query = `
      SELECT l.*, u.username, u.avatar_url, c.display_name as category_name, c.name as category_slug
      FROM listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE l.is_active = TRUE AND l.expiry_date > NOW()
      ORDER BY l.created_at DESC
    `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findById(id) {
        const query = `
      SELECT l.*, u.username, u.avatar_url, c.display_name as category_name, c.name as category_slug
      FROM listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE l.id = ?
    `;
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }
}

module.exports = Listing;
