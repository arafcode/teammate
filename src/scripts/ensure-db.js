const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const schemaPath = path.join(__dirname, '../database/schema.sql');

async function ensureDatabase() {
    try {
        console.log('Ensuring database schema...');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');

        // Remove comments? No, mysql2 handles them usually, or split by ;
        // We split by ; and ignore empty lines
        const queries = schemaSql
            .split(';')
            .map(query => query.trim())
            .filter(query => query.length > 0);

        // Check if categories table needs fix (missing display_name)
        try {
            const [cols] = await db.execute("SHOW COLUMNS FROM categories LIKE 'display_name'");
            if (cols.length === 0) {
                console.log('Fixing categories table schema...');
                await db.execute('SET FOREIGN_KEY_CHECKS = 0');
                await db.execute('DROP TABLE IF EXISTS categories');
                await db.execute('SET FOREIGN_KEY_CHECKS = 1');
            }
        } catch (e) {
            // Table might not exist, ignore
        }

        for (const query of queries) {
            try {
                // Skip drop statements if any exist in schema (there shouldn't be, but just in case)
                if (query.toUpperCase().startsWith('DROP')) continue;

                await db.execute(query);
            } catch (err) {
                // If error is "Table exists", ignore? 
                // schema.sql uses IF NOT EXISTS, so should be fine.
                console.warn('Query warning:', err.message);
            }
        }

        console.log('Database schema ensured.');
    } catch (error) {
        console.error('Database initialization error:', error);
        // Do not exit process, let app try to run? Or fail hard?
        // Fail hard is safer for debugging
        throw error;
    }
}

module.exports = ensureDatabase;
