const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return res.status(401).json({ message: 'Erişim reddedildi. Token bulunamadı.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'gizli_anahtar'); // .env'den almalı
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Geçersiz token.' });
    }
};

module.exports = authMiddleware;
