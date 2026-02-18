
const db = require('../config/db');

async function checkSchema() {
    try {
        const [rows] = await db.execute("DESCRIBE users");
        console.log("Users Table Columns:");
        rows.forEach(row => console.log(`- ${row.Field} (${row.Type})`));
        process.exit(0);
    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    }
}

checkSchema();
