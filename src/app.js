const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config();

// Servisler ve Konfigürasyon
const db = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const listingRoutes = require('./routes/listingRoutes');
const messageRoutes = require('./routes/messageRoutes');
const profileRoutes = require('./routes/profileRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const communityRoutes = require('./routes/communityRoutes');
const groupRoutes = require('./routes/groupRoutes');
const eventRoutes = require('./routes/eventRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use(helmet({
    contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/events', eventRoutes);

// Basit Test Rotası
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Teammate API çalışıyor' });
});

// Sunucuyu Başlat
const ensureDatabase = require('./scripts/ensure-db');

ensureDatabase().then(() => {
    app.listen(PORT, () => {
        console.log(`Sunucu ${PORT} portunda çalışıyor: http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to ensure database:', err);
    process.exit(1);
});
