const db = require('../config/db');

class Listing {
    static async create(listingData) {
        const { user_id, category_id, subcategory, title, description, activity_date, expiry_date, location, max_participants } = listingData;

        const [result] = await db.execute(
            `INSERT INTO listings 
      (user_id, category_id, subcategory, title, description, activity_date, expiry_date, location, max_participants) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                category_id,
                subcategory,
                title,
                description,
                activity_date,
                expiry_date,
                location || null,
                max_participants || 1
            ]
        );
        return result.insertId;
    }

    static async findAll() {
        const query = `
        SELECT
        l.id, l.user_id, l.category_id, l.subcategory, l.title, l.description, l.location, l.max_participants, l.is_active,
            DATE_FORMAT(l.activity_date, '%Y-%m-%dT%H:%i:%s.000Z') as activity_date,
            DATE_FORMAT(l.expiry_date, '%Y-%m-%dT%H:%i:%s.000Z') as expiry_date,
            DATE_FORMAT(l.created_at, '%Y-%m-%dT%H:%i:%s.000Z') as created_at,
            u.username, u.email, u.avatar_url, c.display_name as category_name, c.name as category_slug
      FROM listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE l.is_active = TRUE AND l.expiry_date > DATE_SUB(NOW(), INTERVAL 20 SECOND)
      ORDER BY l.created_at DESC
        `;
        const [rows] = await db.execute(query);
        return rows;
    }

    static async findById(id) {
        const query = `
        SELECT
        l.id, l.user_id, l.category_id, l.subcategory, l.title, l.description, l.location, l.max_participants, l.is_active,
            DATE_FORMAT(l.activity_date, '%Y-%m-%dT%H:%i:%s.000Z') as activity_date,
            DATE_FORMAT(l.expiry_date, '%Y-%m-%dT%H:%i:%s.000Z') as expiry_date,
            DATE_FORMAT(l.created_at, '%Y-%m-%dT%H:%i:%s.000Z') as created_at,
            u.username, u.avatar_url, c.display_name as category_name, c.name as category_slug
      FROM listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE l.id = ?
            `;
        const [rows] = await db.execute(query, [id]);
        return rows[0];
    }

    static async findByUsername(username) {
        const query = `
        SELECT
        l.id, l.user_id, l.category_id, l.subcategory, l.title, l.description, l.location, l.max_participants, l.is_active,
            DATE_FORMAT(l.activity_date, '%Y-%m-%dT%H:%i:%s.000Z') as activity_date,
            DATE_FORMAT(l.expiry_date, '%Y-%m-%dT%H:%i:%s.000Z') as expiry_date,
            DATE_FORMAT(l.created_at, '%Y-%m-%dT%H:%i:%s.000Z') as created_at,
            u.username, u.avatar_url, c.display_name as category_name, c.name as category_slug
      FROM listings l
      JOIN users u ON l.user_id = u.id
      JOIN categories c ON l.category_id = c.id
      WHERE u.username = ? AND l.is_active = TRUE
      ORDER BY l.created_at DESC
        `;
        const [rows] = await db.execute(query, [username]);
        return rows;
    }
    static async delete(id) {
        const [result] = await db.execute('UPDATE listings SET is_active = FALSE WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Listing;
