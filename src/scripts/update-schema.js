const db = require('../config/db');

async function updateSchema() {
    try {
        console.log('Checking for subcategory column in listings table...');

        // Check if column exists
        const [columns] = await db.execute(`
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = DATABASE() 
            AND TABLE_NAME = 'listings' 
            AND COLUMN_NAME = 'subcategory'
        `);

        if (columns.length === 0) {
            console.log('Adding subcategory column...');
            await db.execute(`
                ALTER TABLE listings 
                ADD COLUMN subcategory VARCHAR(100) AFTER title
            `);
            console.log('Subcategory column added successfully.');
        } else {
            console.log('Subcategory column already exists.');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema();
