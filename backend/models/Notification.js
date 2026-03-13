const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        message: {
            type: String,
            required: true,
        },
        type: {
            type: String,
            enum: ['appointment', 'prescription', 'general'],
            default: 'general',
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        link: {
            type: String, // Optional link (e.g., to appointment details)
        }
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
