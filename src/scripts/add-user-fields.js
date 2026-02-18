
const db = require('../config/db');

async function migrate() {
    console.log('Migrating users table...');
    try {
        await db.execute("ALTER TABLE users ADD COLUMN city VARCHAR(50);");
        console.log('Added city');
    } catch (e) { console.log('City might exist', e.message); }

    try {
        await db.execute("ALTER TABLE users ADD COLUMN gender VARCHAR(20);");
        console.log('Added gender');
    } catch (e) { console.log('Gender might exist', e.message); }

    try {
        await db.execute("ALTER TABLE users ADD COLUMN birth_date DATE;");
        console.log('Added birth_date');
    } catch (e) { console.log('Birth_date might exist', e.message); }

    console.log('Migration complete.');
    process.exit(0);
}

migrate();
