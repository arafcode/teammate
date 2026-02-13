const db = require('../config/db');

async function resetDb() {
    try {
        console.log('Deleting all listings...');
        await db.execute('DELETE FROM listings');

        console.log('Deleting all users...');
        await db.execute('DELETE FROM users');

        console.log('Database cleared successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Error clearing database:', error);
        process.exit(1);
    }
}

resetDb();
