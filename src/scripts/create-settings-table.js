require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    const conn = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });
    console.log('Connected.');

    await conn.execute(`
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INT PRIMARY KEY,
            notify_messages BOOLEAN DEFAULT TRUE,
            notify_comments BOOLEAN DEFAULT TRUE,
            notify_listings BOOLEAN DEFAULT TRUE,
            privacy_show_online BOOLEAN DEFAULT TRUE,
            privacy_show_city BOOLEAN DEFAULT TRUE,
            privacy_show_interests BOOLEAN DEFAULT TRUE,
            privacy_profile_public BOOLEAN DEFAULT TRUE,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `);
    console.log('user_settings table ready.');
    await conn.end();
    console.log('Done!');
}

run().catch(e => { console.error(e); process.exit(1); });
