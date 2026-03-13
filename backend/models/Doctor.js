const mongoose = require('mongoose');

const doctorSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        specialty: {
            type: String,
            required: true,
        },
        qualifications: {
            type: [String],
            required: true,
        },
        experience: {
            type: Number,
            required: true,
        },
        isVerified: {
            type: Boolean,
            default: true,
        },
        availability: [
            {
                day: {
                    type: String,
                    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
                },
                startTime: String, // e.g., "09:00"
                endTime: String,   // e.g., "17:00"
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

module.exports = Doctor;
