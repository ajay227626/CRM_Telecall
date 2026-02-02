const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Role = require('./models/Role');

dotenv.config();

// Connect to MongoDB
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/telecall_crm';
mongoose.connect(mongoUri)
    .then(async () => {
        console.log('MongoDB Connected');
        await seedSystemRoles();
        process.exit(0);
    })
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

async function seedSystemRoles() {
    try {
        // Check if system roles already exist
        const existingRoles = await Role.countDocuments({ isSystemRole: true });
        if (existingRoles > 0) {
            console.log('System roles already exist. Skipping seed.');
            return;
        }

        console.log('Seeding system roles...');

        const systemRoles = [
            {
                name: 'SuperAdmin',
                displayName: 'Super Administrator',
                description: 'Full system access. Can manage all admins and moderators.',
                isSystemRole: true,
                permissions: {
                    leads: { view: true, create: true, edit: true, delete: true, export: true, import: true },
                    calls: { view: true, create: true, edit: true, delete: true, viewRecordings: true },
                    users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
                    reports: { view: true, generate: true, export: true },
                    settings: { view: true, edit: true, manageIntegrations: true },
                    dashboard: { view: true, viewAnalytics: true }
                }
            },
            {
                name: 'Moderator',
                displayName: 'Moderator',
                description: 'Can manage multiple admins. Created by SuperAdmin.',
                isSystemRole: true,
                permissions: {
                    leads: { view: true, create: true, edit: true, delete: true, export: true, import: true },
                    calls: { view: true, create: true, edit: true, delete: true, viewRecordings: true },
                    users: { view: true, create: true, edit: true, delete: false, manageRoles: false },
                    reports: { view: true, generate: true, export: true },
                    settings: { view: true, edit: false, manageIntegrations: false },
                    dashboard: { view: true, viewAnalytics: true }
                }
            },
            {
                name: 'Admin',
                displayName: 'Administrator',
                description: 'Tenant owner. Can create custom roles and manage their users.',
                isSystemRole: true,
                permissions: {
                    leads: { view: true, create: true, edit: true, delete: true, export: true, import: true },
                    calls: { view: true, create: true, edit: true, delete: true, viewRecordings: true },
                    users: { view: true, create: true, edit: true, delete: true, manageRoles: true },
                    reports: { view: true, generate: true, export: true },
                    settings: { view: true, edit: true, manageIntegrations: true },
                    dashboard: { view: true, viewAnalytics: true }
                }
            },
            {
                name: 'Guest',
                displayName: 'Guest User',
                description: 'Trial user with limited permissions (7/15 days).',
                isSystemRole: true,
                permissions: {
                    leads: { view: true, create: false, edit: false, delete: false, export: false, import: false },
                    calls: { view: true, create: false, edit: false, delete: false, viewRecordings: false },
                    users: { view: false, create: false, edit: false, delete: false, manageRoles: false },
                    reports: { view: true, generate: false, export: false },
                    settings: { view: false, edit: false, manageIntegrations: false },
                    dashboard: { view: true, viewAnalytics: false }
                }
            }
        ];

        await Role.insertMany(systemRoles);
        console.log('✅ System roles seeded successfully!');
        console.log('Created roles:', systemRoles.map(r => r.name).join(', '));
    } catch (error) {
        console.error('Error seeding system roles:', error);
        throw error;
    }
}
