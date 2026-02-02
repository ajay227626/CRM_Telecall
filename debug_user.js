const mongoose = require('mongoose');
const User = require('./backend/models/User'); // Adjust path as needed
require('dotenv').config({ path: './backend/.env' });

async function checkUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: 'ajay22071997barman@gmail.com' });
        console.log('User Found:', user ? user.name : 'No user');
        if (user) {
            console.log('Facebook ID:', user.facebookId);
            console.log('Facebook Avatar:', user.facebookAvatar);
            console.log('Google Avatar:', user.googleAvatar);
            console.log('Current Avatar:', user.avatar);
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.disconnect();
    }
}

checkUser();
