const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const authMiddleware = require('../middleware/authMiddleware');

// All settings routes require authentication
router.use(authMiddleware);

router.get('/', settingsController.getSettings);
router.put('/account', settingsController.updateAccount);
router.put('/password', settingsController.changePassword);
router.put('/notifications', settingsController.updateNotifications);
router.put('/privacy', settingsController.updatePrivacy);
router.delete('/account', settingsController.deleteAccount);

module.exports = router;
