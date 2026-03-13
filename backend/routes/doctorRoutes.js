const express = require('express');
const router = express.Router();
const { getDoctors, getAllDoctorsAdmin, getDoctorById, updateAvailability, verifyDoctor } = require('../controllers/doctorController');
const { protect, doctor, admin } = require('../middleware/authMiddleware');

router.route('/').get(getDoctors);
router.route('/admin/all').get(protect, admin, getAllDoctorsAdmin);
router.route('/availability').put(protect, doctor, updateAvailability);
router.route('/:id').get(getDoctorById);
router.route('/:id/verify').put(protect, admin, verifyDoctor);

module.exports = router;
