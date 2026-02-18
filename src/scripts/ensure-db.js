const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const schemaPath = path.join(__dirname, '../database/schema.sql');

async function ensureDatabase() {
    try {
        console.log('Ensuring database schema...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // We split by ; and ignore empty lines
        const queries = schemaSql
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0);

        // Check if users table needs columns (Railway migration)
        try {
            const extraColumns = [
                "ADD COLUMN avatar_url VARCHAR(500)",
                "ADD COLUMN bio TEXT",
                "ADD COLUMN social_links JSON",
                "ADD COLUMN city VARCHAR(50)",
                "ADD COLUMN gender VARCHAR(20)",
                "ADD COLUMN birth_date DATE",
                "ADD COLUMN availability_status ENUM('online', 'offline', 'looking_for_team', 'in_game') DEFAULT 'offline'"
            ];

            for (const colDef of extraColumns) {
                try {
                    await db.execute(`ALTER TABLE users ${colDef}`);
                    console.log(`Added column to users: ${colDef}`);
                } catch (e) {
                    if (!e.message.includes("Duplicate column name")) {
                        // console.warn(`Column add warning: ${e.message}`);
                    }
                }
            }
        } catch (e) {
            console.error("User table fix failed:", e);
        }

        // Fix Categories Table (Missing display_name)
        try {
            const [cols] = await db.execute("SHOW COLUMNS FROM categories LIKE 'display_name'");
            if (cols.length === 0) {
                console.log('Fixing categories table schema...');
                await db.execute('ALTER TABLE categories ADD COLUMN display_name VARCHAR(50) NOT NULL DEFAULT ""');
                await db.execute('UPDATE categories SET display_name = "Sanal Ortam" WHERE name = "virtual"');
                await db.execute('UPDATE categories SET display_name = "Gerçek Hayat" WHERE name = "real_life"');
            }
        } catch (e) {
            // Table might not exist yet
        }

        // Fix Listings Table (Missing is_active or subcategory)
        try {
            await db.execute("ALTER TABLE listings ADD COLUMN is_active BOOLEAN DEFAULT TRUE");
            console.log('Added is_active to listings');
        } catch (e) {
            // Ignore if exists
        }
        try {
            await db.execute("ALTER TABLE listings ADD COLUMN subcategory VARCHAR(50)");
            console.log('Added subcategory to listings');
        } catch (e) {
            // Ignore
        }

        for (const query of queries) {
            try {
                // Skip drop statements if any exist in schema (there shouldn't be, but just in case)
                if (query.toUpperCase().startsWith('DROP')) continue;

                await db.execute(query);
            } catch (err) {
                // Ignore "Table exists" warnings
                if (!err.message.includes("already exists")) {
                    console.warn('Query warning:', err.message);
                }
            }
        }

        console.log('Database schema ensured.');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

module.exports = ensureDatabase;
