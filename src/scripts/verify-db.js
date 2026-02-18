const db = require('../config/db');

async function checkSchema() {
    try {
        console.log('Checking users table...');
        const [columns] = await db.execute("SHOW COLUMNS FROM users");
        console.log(columns.map(c => `${c.Field} (${c.Type})`));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkSchema();
