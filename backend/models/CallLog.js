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
    aiScore: { type: Number, min: 0, max: 10 },
    aiSummary: { type: String },
    transcription: { type: String },
    recordingUrl: { type: String },
    notes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('CallLog', callLogSchema);
