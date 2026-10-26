const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config();

async function createTestAdmin() {
    try {
        const uri = process.env.MONGODB_URI;
        if (!uri) throw new Error('MONGODB_URI not found in environment');
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        const hashedPassword = await bcrypt.hash('password123', 10);

        const testUser = {
            name: 'Test Admin',
            email: 'testadmin@example.com',
            password: hashedPassword,
            role: 'Admin',
            systemRole: 'Admin',
            permissions: []
        };

        // Check if exists
        let user = await User.findOne({ email: testUser.email });
        if (user) {
            console.log('Test Admin already exists. Resetting password...');
            user.password = hashedPassword;
            user.role = 'Admin';
            user.systemRole = 'Admin';
            await user.save();
        } else {
            user = await User.create(testUser);
            console.log('Test Admin created.');
        }

        console.log('Email: testadmin@example.com');
        console.log('Password: password123');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

createTestAdmin();
