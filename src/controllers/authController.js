const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/userModel');

const JWT_SECRET = process.env.JWT_SECRET || 'gizli_anahtar'; // Production'da .env zorunlu olmalı

exports.register = async (req, res) => {
    // Validasyon hatalarını kontrol et
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password } = req.body;

    try {
        // Kullanıcı zaten var mı?
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanımda.' });
        }

        // Şifreyi hashlama
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        // Kullanıcı oluşturma
        const userId = await User.create({ username, email, password_hash });

        // JWT Token oluşturma
        const token = jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            message: 'Kullanıcı başarıyla oluşturuldu.',
            token,
            user: { id: userId, username, email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Kullanıcıyı bul
        const user = await User.findByEmail(email);
        if (!user) {
            return res.status(400).json({ message: 'Geçersiz e-posta veya şifre.' });
        }

        // Şifreyi kontrol et
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Geçersiz e-posta veya şifre.' });
        }

        // JWT Token oluştur
        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '24h' });

        res.json({
            message: 'Giriş başarılı.',
            token,
            user: { id: user.id, username: user.username, email: user.email }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'Kullanıcı bulunamadı.' });
        }
        res.json(user);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Sunucu hatası.' });
    }
}
