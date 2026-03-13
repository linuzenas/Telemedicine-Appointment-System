const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema(
    {
        appointment: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Appointment',
            unique: true, // One rating per appointment
        },
        patient: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        doctor: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Doctor',
        },
        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },
        review: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
    }
);

const Rating = mongoose.model('Rating', ratingSchema);

module.exports = Rating;
