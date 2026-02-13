const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Yeni kullanıcı kaydı
// @access  Public
router.post(
    '/register',
    [
        check('username', 'Kullanıcı adı gereklidir.').not().isEmpty(),
        check('email', 'Geçerli bir e-posta adresi giriniz.').isEmail(),
        check('password', 'Şifre en az 6 karakter olmalıdır.').isLength({ min: 6 })
    ],
    authController.register
);

// @route   POST /api/auth/login
// @desc    Kullanıcı girişi ve Token alma
// @access  Public
router.post(
    '/login',
    [
        check('email', 'Geçerli bir e-posta adresi giriniz.').isEmail(),
        check('password', 'Şifre gereklidir.').exists()
    ],
    authController.login
);

// @route   GET /api/auth/me
// @desc    Giriş yapmış kullanıcının bilgilerini getir
// @access  Private
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
