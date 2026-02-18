const db = require('../config/db');
const Listing = require('../models/listingModel');

async function testFindAll() {
    try {
        console.log('Testing Listing.findAll()...');
        const listings = await Listing.findAll();

        console.log(`Found ${listings.length} listings.`);
        if (listings.length > 0) {
            const first = listings[0];
            console.log('Sample Listing Keys:', Object.keys(first));
            console.log('Sample Category Slug:', first.category_slug);
            console.log('Sample Subcategory:', first.subcategory);
            console.log('Sample Title:', first.title);
        } else {
            console.log('No listings found.');
        }

    } catch (err) {
        console.error('Error:', err);
    }
    process.exit();
}

testFindAll();
