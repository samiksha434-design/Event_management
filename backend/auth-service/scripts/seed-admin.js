const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load env
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const User = require('../src/models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/univent', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('MongoDB Connected');

        const adminEmail = 'dhumaksamiksha76@gmail.com';
        const adminPassword = '@SHRUsami..';

        // Check if admin already exists
        let admin = await User.findOne({ email: adminEmail });

        if (admin) {
            console.log('Admin already exists.');
            // Optional: update password if needed
            admin.password = adminPassword;
            await admin.save();
            console.log('Admin password updated.');
        } else {
            admin = new User({
                firstName: 'Admin',
                lastName: 'User',
                email: adminEmail,
                password: adminPassword,
                college: 'Admin College',
                role: 'admin'
            });
            await admin.save();
            console.log('Admin created successfully.');
        }

        mongoose.connection.close();
    } catch (error) {
        console.error('Error seeding admin:', error);
        process.exit(1);
    }
};

seedAdmin();
