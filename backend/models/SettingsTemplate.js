const mongoose = require('mongoose');

const SettingsTemplateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // The category of settings this template governs
    type: {
        type: String,
        required: true,
        enum: ['calling', 'api', 'leads', 'system', 'usermanagement']
    },
    // The hierarchical level of this template
    level: {
        type: String,
        enum: ['system', 'organization', 'group', 'user'],
        required: true
    },
    // Who created this template
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Who does this template apply to? (Optional, if not global for the level)
    targetRole: {
        type: String,
        enum: ['SuperAdmin', 'Moderator', 'Admin', 'Manager', 'User', 'Guest', 'all'],
        default: 'all'
    },
    // The actual configuration values (partial settings)
    config: {
        type: Object,
        default: {}
    },
    // Priority for conflict resolution (higher number = higher priority override)
    priority: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Prevent duplicate template names for the same user/type
SettingsTemplateSchema.index({ createdBy: 1, name: 1, type: 1 }, { unique: true });

module.exports = mongoose.model('SettingsTemplate', SettingsTemplateSchema);
