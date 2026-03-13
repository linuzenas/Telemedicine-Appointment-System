const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ['patient', 'doctor', 'admin'],
            default: 'patient',
        },
        // Patient Profile Fields
        age: { type: Number },
        gender: { type: String, enum: ['Male', 'Female', 'Other'] },
        bloodGroup: { type: String },
        weight: { type: Number },
        height: { type: Number },
        allergies: { type: String, default: '' },
        chronicConditions: { type: String, default: '' },
        emergencyContact: { type: String, default: '' },
    },
    {
        timestamps: true,
    }
);

// Encrypt password using bcrypt before save
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
