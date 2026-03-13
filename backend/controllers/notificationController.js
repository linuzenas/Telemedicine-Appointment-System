const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(notifications);
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read
// @access  Private
const markAllAsRead = async (req, res) => {
    await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
    res.json({ message: 'Notifications marked as read' });
};

// @desc    Create a notification (Internal use mainly)
const createNotification = async (userId, message, type = 'general', link = '') => {
    try {
        await Notification.create({
            user: userId,
            message,
            type,
            link
        });
    } catch (err) {
        console.error('Failed to create notification', err.message);
    }
};

module.exports = { getNotifications, markAllAsRead, createNotification };
