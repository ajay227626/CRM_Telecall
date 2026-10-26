const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function assignAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = process.argv[2] || process.env.ADMIN_EMAIL;
        if (!email) {
            console.log('Usage: node server/assignAdmin.js <email>');
            process.exit(1);
        }
        const user = await User.findOne({ email });

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
