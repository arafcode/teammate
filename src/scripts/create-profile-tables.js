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
    console.log('Connected to database.');

    // Add columns to users table
    const alterCols = [
        "ALTER TABLE users ADD COLUMN bio TEXT",
        "ALTER TABLE users ADD COLUMN social_links JSON",
        "ALTER TABLE users ADD COLUMN availability_status ENUM('online','offline','looking_for_team','in_game') DEFAULT 'offline'"
    ];

    for (const sql of alterCols) {
        try {
            await conn.execute(sql);
            console.log('OK:', sql.substring(0, 50));
        } catch (e) {
            console.log('Skip (exists):', e.message.substring(0, 60));
        }
    }

    // Create user_interests
    await conn.execute(`
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
    console.log('user_interests table ready.');

    // Create profile_comments
    await conn.execute(`
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
    console.log('profile_comments table ready.');

    await conn.end();
    console.log('Migration complete!');
}

run().catch(e => {
    console.error('Migration failed:', e);
    process.exit(1);
});
