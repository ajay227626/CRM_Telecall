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
    notes: { type: String },
    aiScore: { type: Number, min: 0, max: 100, default: 0 },
    intentLevel: { type: String, enum: ['high', 'medium', 'low', 'none'], default: 'none' },
    lastSentiment: { type: String, enum: ['positive', 'neutral', 'negative', null], default: null },
    actionItems: [{ type: String }]
}, { timestamps: true });

const { tenantPlugin } = require('../middleware/tenantContext');
leadSchema.plugin(tenantPlugin);

module.exports = mongoose.model('Lead', leadSchema);
