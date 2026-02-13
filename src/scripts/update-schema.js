const db = require('../config/db');

async function updateSchema() {
    try {
        console.log('Adding new columns to users table...');

        // Add columns one by one to avoid errors if they already exist (though this is a simple script)
        // Or just one ALTER TABLE statement. 
        // Since it's MySQL, we can do multiple ADD COLUMN in one statement.

        const query = `
            ALTER TABLE users 
            ADD COLUMN city VARCHAR(255) NULL,
            ADD COLUMN gender VARCHAR(50) NULL,
            ADD COLUMN birth_date DATE NULL;
        `;

        await db.execute(query);

        console.log('Schema updated successfully.');
        process.exit(0);
    } catch (error) {
        // Ignore "Duplicate column name" error if run multiple times
        if (error.code === 'ER_DUP_FIELDNAME') {
            console.log('Columns already exist. Skipping.');
            process.exit(0);
        }
        console.error('Error updating schema:', error);
        process.exit(1);
    }
}

updateSchema();
