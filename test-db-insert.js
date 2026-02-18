
const db = require('../config/db');

async function testInsert() {
    try {
        const username = 'TestUndefined_' + Date.now();
        const email = 'testundefined@example.com';
        const password_hash = 'hash';
        const city = undefined; // This is the suspect
        const gender = undefined;
        const birth_date = undefined;

        console.log('Attempting insert with undefined values...');

        const [result] = await db.execute(
            'INSERT INTO users (username, email, password_hash, city, gender, birth_date) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, password_hash, city, gender, birth_date]
        );
        console.log('Insert successful, ID:', result.insertId);
        process.exit(0);
    } catch (e) {
        console.error('Insert failed:', e.message);
        process.exit(1);
    }
}

testInsert();
