const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const user = await User.findOne({ email: 'ajay@ceoitbox.in' });
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
