const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // null implies Global/System default if we use it that way
    },
    category: {
        type: String,
        required: true,
        enum: ['calling', 'api', 'leads', 'system', 'usermanagement']
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

// Compound unique index to ensure one setting per category per user
settingsSchema.index({ category: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Settings', settingsSchema);
