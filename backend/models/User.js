const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },

    // System role (for SuperAdmin, Moderator, Admin, Guest)
    systemRole: {
        type: String,
        enum: ['SuperAdmin', 'Moderator', 'Admin', 'Guest', null],
        default: null
    },

    // Custom role (for Admin's users - references Role model)
    customRole: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Role'
    },

    status: { type: String, enum: ['Active', 'Inactive', 'Suspended'], default: 'Active' },
    permissions: [{ type: String }], // Legacy - will be deprecated
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    microsoftId: { type: String, unique: true, sparse: true }, // Microsoft Auth ID
    facebookId: { type: String, unique: true, sparse: true }, // Facebook Auth ID
    avatar: { type: String },
    avatarHistory: [{ type: String }], // Store up to 4 recent uploads
    googleAvatar: { type: String },    // Store the latest Google profile picture
    microsoftAvatar: { type: String }, // Store the latest Microsoft profile picture
    facebookAvatar: { type: String },  // Store the latest Facebook profile picture
    isCustomAvatar: { type: Boolean, default: false }, // Track if using custom or Google
    otp: {
        code: { type: String },
        expiresAt: { type: Date }
    },

    // Trial period for Guest users
    trialPeriod: {
        enabled: { type: Boolean, default: false },
        startDate: { type: Date },
        endDate: { type: Date },
        daysAllowed: { type: Number, default: 7 }
    },

    // Multi-tenancy - for isolating Admin's users
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User' // References the Admin user
    },
    parentAdmin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Direct creator of this user (for hierarchy tracking Manager -> User)
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    // Delegation & Restrictions
    restrictions: {
        canViewUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        canManageUsers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        isRestricted: {
            type: Boolean,
            default: false
        }
    },

    // Super Admin Protection
    isSuperAdminManaged: {
        type: Boolean,
        default: false
    },

    // Security Settings
    requirePasswordReset: {
        type: Boolean,
        default: false
    },
    authMethod: {
        type: String,
        enum: ['Password', 'OTP', 'Both'],
        default: 'Password'
    },

    // Settings overrides (user-specific settings templates)
    settingsOverrides: {
        calling: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SettingsTemplate'
        },
        api: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SettingsTemplate'
        },
        leads: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SettingsTemplate'
        },
        system: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'SettingsTemplate'
        }
    },

    lastLogin: { type: Date, default: null }
}, { timestamps: true });

// Virtual field to get role name
userSchema.virtual('role').get(function () {
    return this.systemRole || 'User';
});

// Ensure virtuals are included in JSON
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
