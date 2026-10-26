const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/telecall_crm';
mongoose.connect(mongoUri)
    .then(async () => {
        console.log('MongoDB Connected');
        await assignSuperAdmin();
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

async function assignSuperAdmin() {
        const email = process.argv[2] || process.env.ADMIN_EMAIL;
        if (!email) {
            console.log('Usage: node server/assignSuperAdmin.js <email>');
            process.exit(1);
        }

        console.log(`Looking for user with email: ${email}`);

        const user = await User.findOne({ email });

        if (!user) {
            console.error(`❌ User not found with email: ${email}`);
            console.log('\nPlease make sure you have logged in with Google OAuth first.');
            return;
        }

        console.log(`Found user: ${user.name} (${user.email})`);
        console.log(`Current role: ${user.systemRole || 'None'}`);

        if (user.systemRole === 'SuperAdmin') {
            console.log('✅ User is already a SuperAdmin!');
            return;
        }

        // Update to SuperAdmin
        user.systemRole = 'SuperAdmin';
        await user.save();

        console.log('✅ Successfully assigned SuperAdmin role!');
        console.log(`\nUser Details:`);
        console.log(`- Name: ${user.name}`);
        console.log(`- Email: ${user.email}`);
        console.log(`- Role: ${user.systemRole}`);
        console.log(`- Status: ${user.status}`);
        console.log(`\n🎉 You are now a SuperAdmin! Please log out and log in again to get a new token.`);
    } catch (error) {
        console.error('Error assigning SuperAdmin:', error);
        throw error;
    }
}
