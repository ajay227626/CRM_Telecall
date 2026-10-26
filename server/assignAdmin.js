const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function assignAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'ajay@ceoitbox.in' });
        if (!user) {
            console.log('User not found');
            process.exit(1);
        }

        user.systemRole = 'Admin';
        await user.save();

        console.log('✅ Successfully assigned Admin role to', user.email);
        console.log('Name:', user.name);
        console.log('Role:', user.systemRole);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

assignAdmin();
