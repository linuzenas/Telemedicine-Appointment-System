const Appointment = require('../models/Appointment');
const Doctor = require('../models/Doctor');
const { createNotification } = require('./notificationController');

// @desc    Create new appointment
// @route   POST /api/appointments
// @access  Private/Patient
const createAppointment = async (req, res) => {
    const { doctorId, date, timeSlot, symptoms } = req.body;

    if (!doctorId || !date || !timeSlot) {
        return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Generate an internal meeting link path
    const meetingLink = `/call/telemedicine_${req.user._id}_${doctorId}_${Date.now()}`;

    // Simple validation to check if slot is already booked
    const existingAppointment = await Appointment.findOne({ doctor: doctorId, date, timeSlot, status: 'scheduled' });
    if (existingAppointment) {
        return res.status(400).json({ message: 'This time slot is already booked.' });
    }

    const appointment = new Appointment({
        patient: req.user._id,
        doctor: doctorId,
        date,
        timeSlot,
        symptoms,
        meetingLink
    });

    const createdAppointment = await appointment.save();

    // Notify doctor
    const doctorProfile = await Doctor.findById(doctorId).populate('user');
    if (doctorProfile) {
        createNotification(
            doctorProfile.user._id,
            `New appointment booked by ${req.user.name} for ${date} at ${timeSlot}`,
            'appointment'
        );
    }

    res.status(201).json(createdAppointment);
};

// @desc    Get logged-in user's appointments
// @route   GET /api/appointments/myappointments
// @access  Private
const getMyAppointments = async (req, res) => {
    let appointments;

    if (req.user.role === 'patient') {
        appointments = await Appointment.find({ patient: req.user._id })
            .populate({
                path: 'doctor',
                populate: {
                    path: 'user',
                    select: 'name email'
                }
            })
            .sort({ date: -1 });
    } else if (req.user.role === 'doctor') {
        const doctorProfile = await Doctor.findOne({ user: req.user._id });
        if (doctorProfile) {
            appointments = await Appointment.find({ doctor: doctorProfile._id })
                .populate('patient', 'name email')
                .sort({ date: -1 });
        } else {
            appointments = [];
        }
    } else {
        // Admin: see all
        appointments = await Appointment.find({})
            .populate('patient', 'name email')
            .populate({
                path: 'doctor',
                populate: { path: 'user', select: 'name email' }
            })
            .sort({ date: -1 });
    }

    res.json(appointments);
};

// @desc    Update appointment status
// @route   PUT /api/appointments/:id/status
// @access  Private
const updateAppointmentStatus = async (req, res) => {
    const { status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (appointment) {
        appointment.status = status;
        const updatedAppointment = await appointment.save();

        if (status === 'cancelled') {
            // Notify doctor or patient based on who cancelled
            if (req.user.role === 'patient') {
                const doctorProfile = await Doctor.findById(appointment.doctor);
                createNotification(
                    doctorProfile.user,
                    `Appointment on ${appointment.date} at ${appointment.timeSlot} was cancelled by the patient.`,
                    'appointment'
                );
            } else if (req.user.role === 'doctor') {
                createNotification(
                    appointment.patient,
                    `Your appointment on ${appointment.date} at ${appointment.timeSlot} was cancelled.`,
                    'appointment'
                );
            }
        }

        res.json(updatedAppointment);
    } else {
        res.status(404).json({ message: 'Appointment not found' });
    }
}

module.exports = { createAppointment, getMyAppointments, updateAppointmentStatus };
