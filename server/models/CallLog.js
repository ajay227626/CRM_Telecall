const mongoose = require('mongoose');

const callLogSchema = new mongoose.Schema({
    leadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead' },
    leadName: { type: String, required: true },
    leadPhone: { type: String, required: true },
    callType: {
        type: String,
        enum: ['Masked', 'Direct', 'WhatsApp', 'Email'],
        default: 'Masked'
    },
    maskedNumber: { type: String },
    caller: { type: String, required: true },
    callTime: { type: Date, default: Date.now },
    duration: { type: Number, default: 0 }, // in seconds
    status: {
        type: String,
        enum: ['initiated', 'ringing', 'completed', 'no answer', 'busy', 'failed'],
        default: 'initiated'
    },
    aiScore: { type: Number, min: 0, max: 100 },
    aiSummary: { type: String },
    transcription: { type: String },
    recordingUrl: { type: String },
    notes: { type: String },
    aiStatus: {
        type: String,
        enum: ['unprocessed', 'processing', 'completed', 'failed'],
        default: 'unprocessed'
    },
    aiAnalysis: {
        summary: { type: String },
        customerSentiment: { type: String, enum: ['positive', 'neutral', 'negative'] },
        sentimentScore: { type: Number },
        leadIntent: { type: String, enum: ['high', 'medium', 'low', 'none'] },
        budgetMentionedINR: { type: Number, default: null },
        detectedObjections: [{ type: String }],
        recommendedDisposition: { type: String },
        actionItems: [{ type: String }],
        telecallerCoachingTip: { type: String },
        analyzedAt: { type: Date }
    }
}, { timestamps: true });

const { tenantPlugin } = require('../middleware/tenantContext');
callLogSchema.plugin(tenantPlugin);

module.exports = mongoose.model('CallLog', callLogSchema);
