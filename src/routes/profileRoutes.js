const express = require('express');
const router = express.Router();
console.log('Profile Routes Loaded');
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');

// Protected (MUST come before /:username to avoid being caught by the wildcard)
router.put('/update', authMiddleware, profileController.updateProfile);
router.post('/interests', authMiddleware, profileController.addInterest);
router.delete('/interests/:id', authMiddleware, profileController.removeInterest);
router.post('/comments', authMiddleware, profileController.addComment);
router.delete('/comments/:id', authMiddleware, profileController.deleteComment);

// Public (wildcard MUST be last)
router.get('/:username', profileController.getProfile);

module.exports = router;
