const express = require('express');
const { check } = require('express-validator');
const listingController = require('../controllers/listingController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/listings
// @desc    Tüm aktif ilanları getir
// @access  Public
router.get('/', listingController.getListings);

// @route   POST /api/listings
// @desc    Yeni ilan oluştur
// @access  Private
router.post(
    '/',
    [
        authMiddleware,
        check('title', 'Başlık gereklidir.').not().isEmpty(),
        check('description', 'Açıklama gereklidir.').not().isEmpty(),
        check('category_slug', 'Kategori (virtual/real_life) gereklidir.').isIn(['virtual', 'real_life']),
        check('expiry_date', 'Geçerlilik tarihi gereklidir.').toDate()
    ],
    listingController.createListing
);

module.exports = router;
