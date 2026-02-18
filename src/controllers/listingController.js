const { validationResult } = require('express-validator');
const Listing = require('../models/listingModel');
const db = require('../config/db');

exports.createListing = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { category_slug, title, description, activity_date, duration_minutes, subcategory, location, max_participants } = req.body;
    const user_id = req.user.id; // Auth middleware'den gelir

    console.log('Creating listing for user:', user_id);
    console.log('Request Body:', req.body);

    try {
        // Kategori ID'sini bul
        const [categories] = await db.execute('SELECT id FROM categories WHERE name = ?', [category_slug]);
        if (categories.length === 0) {
            return res.status(400).json({ message: 'Geçersiz kategori.' });
        }
        const category_id = categories[0].id;

        // Calculate Expiry Date based on Duration
        const duration = duration_minutes ? parseInt(duration_minutes) : 60; // Default 1 hour

        // Handle Date parsing robustly (for both ISO and old formats)
        let activityTime = new Date(activity_date);

        if (isNaN(activityTime.getTime())) {
            console.warn('Invalid activity_date format received:', activity_date);
            // Try appending 'Z' or 'T' if missing/space separated
            if (typeof activity_date === 'string' && activity_date.includes(' ')) {
                activityTime = new Date(activity_date.replace(' ', 'T'));
            }

            // If still invalid, default to NOW as a fallback
            if (isNaN(activityTime.getTime())) {
                console.error('Failed to parse activity_date. Defaulting to current time.');
                activityTime = new Date();
            }
        }

        const expiryDateObj = new Date(activityTime.getTime() + duration * 60000);

        // Format to MySQL DATETIME (YYYY-MM-DD HH:MM:SS)
        const formattedActivityDate = activityTime.toISOString().replace('T', ' ').substring(0, 19);
        const formattedExpiryDate = expiryDateObj.toISOString().replace('T', ' ').substring(0, 19);

        const listingId = await Listing.create({
            user_id,
            category_id,
            subcategory,
            title,
            description,
            activity_date: activityTime,
            expiry_date: expiryDateObj,
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
        const { username } = req.query;
        let listings;

        if (username) {
            listings = await Listing.findByUsername(username);
        } else {
            listings = await Listing.findAll();
        }

        res.json(listings);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

exports.deleteListing = async (req, res) => {
    try {
        const listingId = req.params.id;
        const userId = req.user.id;

        const listing = await Listing.findById(listingId);

        if (!listing) {
            return res.status(404).json({ message: 'İlan bulunamadı.' });
        }

        // Check ownership
        if (listing.user_id !== userId) {
            return res.status(403).json({ message: 'Bu işlem için yetkiniz yok.' });
        }

        const deleted = await Listing.delete(listingId);
        if (deleted) {
            res.json({ message: 'İlan silindi.' });
        } else {
            res.status(400).json({ message: 'Silme işlemi başarısız.' });
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};
