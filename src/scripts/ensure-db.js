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
