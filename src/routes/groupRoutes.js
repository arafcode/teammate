const express = require('express');
const router = express.Router();
const groupController = require('../controllers/groupController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/', groupController.getGroups);
router.get('/:id', groupController.getGroup);
router.get('/:id/posts', groupController.getGroupPosts);

// Protected routes
router.post('/', authMiddleware, groupController.createGroup);
router.delete('/:id', authMiddleware, groupController.deleteGroup);
router.post('/:id/join', authMiddleware, groupController.joinGroup);
router.post('/:id/leave', authMiddleware, groupController.leaveGroup);
router.post('/:id/posts', authMiddleware, groupController.createGroupPost);
router.delete('/:id/posts/:postId', authMiddleware, groupController.deleteGroupPost);

module.exports = router;
