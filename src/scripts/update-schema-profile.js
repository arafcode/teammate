const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
};

async function updateSchema() {
    let connection;
    try {
        console.log('Connecting to database...');
        connection = await mysql.createConnection(dbConfig);

        console.log('Adding columns to users table...');
        // Add columns if they don't exist
        try {
            await connection.execute("ALTER TABLE users ADD COLUMN bio TEXT");
            console.log('Added bio');
        } catch (e) { console.log('bio already exists or error:', e.message); }

        try {
            await connection.execute("ALTER TABLE users ADD COLUMN social_links JSON");
            console.log('Added social_links');
        } catch (e) { console.log('social_links already exists or error:', e.message); }

        try {
            await connection.execute("ALTER TABLE users ADD COLUMN availability_status ENUM('online', 'offline', 'looking_for_team', 'in_game') DEFAULT 'offline'");
            console.log('Added availability_status');
        } catch (e) { console.log('availability_status already exists or error:', e.message); }

        console.log('Creating user_interests table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS user_interests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                category ENUM('virtual', 'real_life') NOT NULL,
                name VARCHAR(100) NOT NULL,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Creating profile_comments table...');
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS profile_comments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                profile_user_id INT NOT NULL,
                author_user_id INT NOT NULL,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (profile_user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (author_user_id) REFERENCES users(id) ON DELETE CASCADE
            )
        `);

        console.log('Schema update completed successfully!');
    } catch (error) {
        console.error('Schema update failed:', error);
    } finally {
        if (connection) await connection.end();
    }
}

updateSchema();
