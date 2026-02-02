const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    type: {
        type: String,
        enum: ['system', 'call', 'lead', 'user'],
        default: 'system'
    },
    relatedId: {
        type: mongoose.Schema.Types.ObjectId
    },
    onModel: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Activity', activitySchema);
