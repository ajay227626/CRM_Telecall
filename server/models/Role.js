const mongoose = require('mongoose');

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    displayName: {
        type: String,
        required: true
    },
    description: {
        type: String,
        default: ''
    },
    isSystemRole: {
        type: Boolean,
        default: false
    },
    // For custom roles - which Admin created this role
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // For custom roles - tenant isolation
    tenantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    // Granular permissions
    permissions: {
        leads: {
            view: { type: Boolean, default: false },
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            export: { type: Boolean, default: false },
            import: { type: Boolean, default: false }
        },
        calls: {
            view: { type: Boolean, default: false },
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            viewRecordings: { type: Boolean, default: false }
        },
        users: {
            view: { type: Boolean, default: false },
            create: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            delete: { type: Boolean, default: false },
            manageRoles: { type: Boolean, default: false }
        },
        reports: {
            view: { type: Boolean, default: false },
            generate: { type: Boolean, default: false },
            export: { type: Boolean, default: false }
        },
        settings: {
            view: { type: Boolean, default: false },
            edit: { type: Boolean, default: false },
            manageIntegrations: { type: Boolean, default: false }
        },
        dashboard: {
            view: { type: Boolean, default: false },
            viewAnalytics: { type: Boolean, default: false }
        }
    }
}, { timestamps: true });

// Index for faster queries
roleSchema.index({ tenantId: 1, isSystemRole: 1 });
roleSchema.index({ name: 1, tenantId: 1 }, { unique: true });

module.exports = mongoose.model('Role', roleSchema);
