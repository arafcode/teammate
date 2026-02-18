const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', eventController.getEvents);
router.get('/:id', eventController.getEvent);

router.post('/', authMiddleware, eventController.createEvent);
router.delete('/:id', authMiddleware, eventController.deleteEvent);
router.post('/:id/join', authMiddleware, eventController.joinEvent);
router.post('/:id/leave', authMiddleware, eventController.leaveEvent);

module.exports = router;
