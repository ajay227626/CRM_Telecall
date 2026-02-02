const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    whatsapp: { type: String },
    email: { type: String, required: true },
    category: {
        type: String,
        enum: ['Real Estate', 'Construction', 'Insurance', 'Education', 'Other'],
        default: 'Other'
    },
    source: {
        type: String,
        enum: ['Website', 'Referral', 'Cold Call', 'Social Media', 'Meta', 'Manual', 'Import', 'Other'],
        default: 'Manual'
    },
    // Meta Lead Ads integration fields
    metaLeadId: {
        type: String,
        unique: true,
        sparse: true // Only Meta leads will have this
    },
    metaFormId: {
        type: String
    },
    metaPageId: {
        type: String
    },
    // Store original Meta data for reference
    rawMetaData: {
        type: mongoose.Schema.Types.Mixed
    },
    status: {
        type: String,
        enum: ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'],
        default: 'New'
    },
    statusChangedAt: { type: Date, default: Date.now }, // Track when status last changed for aging
    assignedTo: { type: String },
    followUpDate: { type: Date },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Lead', leadSchema);
