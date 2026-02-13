const { validationResult } = require('express-validator');
const Listing = require('../models/listingModel');
const db = require('../config/db');

exports.createListing = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { category_slug, title, description, activity_date, expiry_date, location, max_participants } = req.body;
    const user_id = req.user.id; // Auth middleware'den gelir

    try {
        // Kategori ID'sini bul
        const [categories] = await db.execute('SELECT id FROM categories WHERE name = ?', [category_slug]);
        if (categories.length === 0) {
            return res.status(400).json({ message: 'Geçersiz kategori.' });
        }
        const category_id = categories[0].id;

        const listingId = await Listing.create({
            user_id,
            category_id,
            title,
            description,
            activity_date,
            expiry_date,
            location: category_slug === 'real_life' ? location : null,
            max_participants
        });

        res.status(201).json({ message: 'İlan oluşturuldu.', listingId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

exports.getListings = async (req, res) => {
    try {
        const listings = await Listing.findAll();
        res.json(listings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
