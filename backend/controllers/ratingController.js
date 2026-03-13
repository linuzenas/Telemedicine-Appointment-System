const Rating = require('../models/Rating');
const Doctor = require('../models/Doctor');

// @desc    Submit a rating for a completed appointment
// @route   POST /api/ratings
// @access  Private/Patient
const submitRating = async (req, res) => {
    const { appointmentId, doctorId, rating, review } = req.body;

    // Check if already rated
    const existing = await Rating.findOne({ appointment: appointmentId });
    if (existing) {
        return res.status(400).json({ message: 'You have already rated this appointment.' });
    }

    const newRating = await Rating.create({
        appointment: appointmentId,
        patient: req.user._id,
        doctor: doctorId,
        rating,
        review: review || '',
    });

    res.status(201).json(newRating);
};

// @desc    Get all ratings for a specific doctor
// @route   GET /api/ratings/doctor/:doctorId
// @access  Public
const getDoctorRatings = async (req, res) => {
    const ratings = await Rating.find({ doctor: req.params.doctorId })
        .populate('patient', 'name')
        .sort({ createdAt: -1 });

    const avg = ratings.length > 0
        ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
        : 0;

    res.json({ ratings, averageRating: Number(avg), totalReviews: ratings.length });
};

// @desc    Check if patient already rated an appointment
// @route   GET /api/ratings/appointment/:appointmentId
// @access  Private
const getRatingByAppointment = async (req, res) => {
    const rating = await Rating.findOne({ appointment: req.params.appointmentId });
    if (rating) {
        res.json(rating);
    } else {
        res.json(null);
    }
};

module.exports = { submitRating, getDoctorRatings, getRatingByAppointment };
