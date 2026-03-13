const Prescription = require('../models/Prescription');
const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');

// @desc    Create prescription
// @route   POST /api/prescriptions
// @access  Private/Doctor
const createPrescription = async (req, res) => {
    const { appointmentId, patientId, medications, notes } = req.body;

    const doctorProfile = await Doctor.findOne({ user: req.user._id });

    if (!doctorProfile) {
        return res.status(404).json({ message: 'Doctor profile not found' });
    }

    const prescription = new Prescription({
        appointment: appointmentId,
        patient: patientId,
        doctor: doctorProfile._id,
        medications,
        notes,
    });

    const createdPrescription = await prescription.save();

    // Mark appointment as completed
    const appointment = await Appointment.findById(appointmentId);
    if (appointment) {
        appointment.status = 'completed';
        await appointment.save();
    }

    res.status(201).json(createdPrescription);
};

// @desc    Get prescriptions for an appointment
// @route   GET /api/prescriptions/appointment/:id
// @access  Private
const getPrescriptionByAppointment = async (req, res) => {
    const prescription = await Prescription.findOne({ appointment: req.params.id }).populate('doctor').populate('patient', 'name email');

    if (prescription) {
        res.json(prescription);
    } else {
        res.status(404).json({ message: 'Prescription not found' });
    }
};

module.exports = { createPrescription, getPrescriptionByAppointment };
