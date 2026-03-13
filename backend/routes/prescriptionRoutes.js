const express = require('express');
const router = express.Router();
const { createPrescription, getPrescriptionByAppointment } = require('../controllers/prescriptionController');
const { protect, doctor } = require('../middleware/authMiddleware');

router.route('/').post(protect, doctor, createPrescription);
router.route('/appointment/:id').get(protect, getPrescriptionByAppointment);

module.exports = router;
