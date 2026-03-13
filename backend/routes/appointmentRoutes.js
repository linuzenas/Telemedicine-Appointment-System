const express = require('express');
const router = express.Router();
const { createAppointment, getMyAppointments, updateAppointmentStatus } = require('../controllers/appointmentController');
const { protect, doctor } = require('../middleware/authMiddleware');

router.route('/').post(protect, createAppointment);
router.route('/myappointments').get(protect, getMyAppointments);
router.route('/:id/status').put(protect, updateAppointmentStatus);

module.exports = router;
