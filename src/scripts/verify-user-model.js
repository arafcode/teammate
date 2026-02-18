const db = require('../config/db');

async function checkListings() {
    try {
        const [listings] = await db.execute('SELECT * FROM listings');
        console.log('Listings in DB:', listings);

        const [categories] = await db.execute('SELECT * FROM categories');
        console.log('Categories:', categories);
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkListings();
