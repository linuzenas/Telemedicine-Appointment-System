const express = require('express');
const router = express.Router();
const { submitRating, getDoctorRatings, getRatingByAppointment } = require('../controllers/ratingController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, submitRating);
router.route('/doctor/:doctorId').get(getDoctorRatings);
router.route('/appointment/:appointmentId').get(protect, getRatingByAppointment);

module.exports = router;
