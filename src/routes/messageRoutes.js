const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, messageController.sendMessage);
router.get('/', authMiddleware, messageController.getMessages);
router.post('/read', authMiddleware, messageController.markRead);

module.exports = router;
