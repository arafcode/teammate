const express = require('express');
const router = express.Router();
const communityController = require('../controllers/communityController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/posts', communityController.getPosts);
router.get('/posts/:id/comments', communityController.getComments);

// Protected routes
router.post('/posts', authMiddleware, communityController.createPost);
router.delete('/posts/:id', authMiddleware, communityController.deletePost);
router.post('/posts/:id/like', authMiddleware, communityController.toggleLike);
router.post('/posts/:id/comments', authMiddleware, communityController.addComment);
router.delete('/comments/:commentId', authMiddleware, communityController.deleteComment);

module.exports = router;
