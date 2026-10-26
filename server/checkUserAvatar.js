const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = process.argv[2] || process.env.ADMIN_EMAIL;
        if (!email) {
            console.log('Usage: node server/checkUserAvatar.js <email>');
            process.exit(1);
        }
        const user = await User.findOne({ email });
        console.log('\nUser data:');
        console.log('Name:', user.name);
        console.log('Email:', user.email);
        console.log('Avatar:', user.avatar);
        console.log('SystemRole:', user.systemRole);
        console.log('GoogleId:', user.googleId);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkUser();
