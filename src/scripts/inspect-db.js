const db = require('../config/db');

async function checkListings() {
    try {
        const query = `
            SELECT l.id, l.title, c.name as category_slug, l.subcategory 
            FROM listings l 
            JOIN categories c ON l.category_id = c.id 
            ORDER BY l.id DESC LIMIT 5
        `;
        const [listings] = await db.execute(query);
        console.log('Last 5 Listings:', JSON.stringify(listings, null, 2));
    } catch (err) {
        console.error(err);
    }
    process.exit();
}

checkListings();
