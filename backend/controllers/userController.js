const User = require('../models/User');
const Doctor = require('../models/Doctor');
const generateToken = require('../utils/generateToken');

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, specialty, qualifications, experience } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
    });

    if (user) {
        // If the user registered as a doctor, create their doctor profile
        if (role === 'doctor') {
            try {
                await Doctor.create({
                    user: user._id,
                    specialty: specialty || 'General',
                    qualifications: qualifications || [],
                    experience: Number(experience) || 0,
                    isVerified: true,
                });
                console.log('Doctor profile created successfully for:', user.name);
            } catch (docErr) {
                console.error('Failed to create doctor profile:', docErr.message);
            }
        }

        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400).json({ message: 'Invalid user data' });
    }
};

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401).json({ message: 'Invalid email or password' });
    }
};

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.age = req.body.age || user.age;
        user.gender = req.body.gender || user.gender;
        user.bloodGroup = req.body.bloodGroup || user.bloodGroup;
        user.weight = req.body.weight || user.weight;
        user.height = req.body.height || user.height;
        user.allergies = req.body.allergies !== undefined ? req.body.allergies : user.allergies;
        user.chronicConditions = req.body.chronicConditions !== undefined ? req.body.chronicConditions : user.chronicConditions;
        user.emergencyContact = req.body.emergencyContact !== undefined ? req.body.emergencyContact : user.emergencyContact;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            age: updatedUser.age,
            gender: updatedUser.gender,
            bloodGroup: updatedUser.bloodGroup,
            weight: updatedUser.weight,
            height: updatedUser.height,
            allergies: updatedUser.allergies,
            chronicConditions: updatedUser.chronicConditions,
            emergencyContact: updatedUser.emergencyContact,
        });
    } else {
        res.status(404).json({ message: 'User not found' });
    }
};

module.exports = { registerUser, authUser, getUserProfile, updateUserProfile };
