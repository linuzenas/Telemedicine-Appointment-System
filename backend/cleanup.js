const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://9923008040:solverforindia@telemedicine.cqiu8oj.mongodb.net/?appName=Telemedicine')
    .then(async () => {
        const User = require('./models/User');
        const Doctor = require('./models/Doctor');

        // Remove hardcoded demo doctors
        const r1 = await User.deleteMany({ email: { $in: ['dr.smith@example.com', 'dr.jones@example.com'] } });
        console.log('Deleted demo users:', r1.deletedCount);

        // Remove orphaned doctor profiles (those whose user no longer exists)
        const doctors = await Doctor.find({}).populate('user');
        let orphanCount = 0;
        for (const doc of doctors) {
            if (!doc.user) {
                await Doctor.deleteOne({ _id: doc._id });
                orphanCount++;
            }
        }
        console.log('Deleted orphaned doctor profiles:', orphanCount);
        console.log('Cleanup complete!');
        process.exit(0);
    })
    .catch((e) => { console.error(e); process.exit(1); });
