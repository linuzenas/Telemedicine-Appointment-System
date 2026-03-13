const express = require('express');
const router = express.Router();
const { getNotifications, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getNotifications);
router.route('/read').put(protect, markAllAsRead);

module.exports = router;
