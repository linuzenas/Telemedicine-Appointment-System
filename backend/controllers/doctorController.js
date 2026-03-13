const Doctor = require('../models/Doctor');

// @desc    Get all verified doctors
// @route   GET /api/doctors
// @access  Public
const getDoctors = async (req, res) => {
    const doctors = await Doctor.find({ isVerified: true }).populate('user', 'name email');
    res.json(doctors);
};

// @desc    Get all doctors (verified and unverified)
// @route   GET /api/doctors/admin/all
// @access  Private/Admin
const getAllDoctorsAdmin = async (req, res) => {
    const doctors = await Doctor.find({}).populate('user', 'name email');
    res.json(doctors);
};

// @desc    Get doctor profile
// @route   GET /api/doctors/:id
// @access  Public
const getDoctorById = async (req, res) => {
    const doctor = await Doctor.findById(req.params.id).populate('user', 'name email');

    if (doctor) {
        res.json(doctor);
    } else {
        res.status(404).json({ message: 'Doctor not found' });
    }
};

// @desc    Update doctor availability
// @route   PUT /api/doctors/availability
// @access  Private/Doctor
const updateAvailability = async (req, res) => {
    const { availability } = req.body; // Array of objects: { day, startTime, endTime }

    const doctor = await Doctor.findOne({ user: req.user._id });

    if (doctor) {
        doctor.availability = availability;
        const updatedDoctor = await doctor.save();
        res.json(updatedDoctor);
    } else {
        res.status(404).json({ message: 'Doctor profile not found' });
    }
};

// @desc    Verify a doctor
// @route   PUT /api/doctors/:id/verify
// @access  Private/Admin
const verifyDoctor = async (req, res) => {
    const doctor = await Doctor.findById(req.params.id);

    if (doctor) {
        // If revoke flag is passed, set to false; otherwise set to true
        doctor.isVerified = req.body.revoke ? false : true;
        const updatedDoctor = await doctor.save();
        res.json(updatedDoctor);
    } else {
        res.status(404).json({ message: 'Doctor profile not found' });
    }
};

module.exports = { getDoctors, getAllDoctorsAdmin, getDoctorById, updateAvailability, verifyDoctor };
