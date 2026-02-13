const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Servisler ve Konfigürasyon
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);

// Basit Test Rotası
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Teammate API çalışıyor' });
});

// Sunucuyu Başlat
app.listen(PORT, () => {
    console.log(`Sunucu ${PORT} portunda çalışıyor: http://localhost:${PORT}`);
});
