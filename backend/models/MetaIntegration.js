const mongoose = require('mongoose');

/**
 * MetaIntegration Schema
 * Stores company-wide Meta (Facebook/Instagram) integrations
 * Admin-managed: Admins can add multiple Meta accounts for different campaigns
 */
const metaIntegrationSchema = new mongoose.Schema({
    // Account name for identification (e.g., "Main Campaign", "Product Launch 2024")
    accountName: {
        type: String,
        required: true
    },
    // Description of this Meta account's purpose
    description: {
        type: String,
        default: ''
    },
    platform: {
        type: String,
        default: 'meta',
        immutable: true
    },
    // Access token (encrypted at rest in production)
    accessToken: {
        type: String,
        required: true
    },
    tokenExpiresAt: {
        type: Date
    },
    // Connected Facebook/Instagram pages
    pages: [{
        pageId: {
            type: String,
            required: true
        },
        pageName: {
            type: String,
            required: true
        },
        // Page-specific access token
        accessToken: {
            type: String,
            required: true
        },
        // Whether webhooks are subscribed for this page
        webhookSubscribed: {
            type: Boolean,
            default: false
        },
        // Forms available on this page
        forms: [{
            formId: String,
            formName: String
        }]
    }],
    // Lead assignment strategy for this integration
    leadAssignment: {
        type: String,
        enum: ['round-robin', 'specific-user', 'unassigned'],
        default: 'unassigned'
    },
    // If leadAssignment is 'specific-user', assign to this user
    assignTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastSyncAt: {
        type: Date
    },
    // Sync statistics
    stats: {
        totalLeadsSynced: {
            type: Number,
            default: 0
        },
        lastLeadSyncedAt: {
            type: Date
        }
    },
    // Admin who created this integration
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster page lookups during webhook processing
metaIntegrationSchema.index({ 'pages.pageId': 1 });

// Update the updatedAt timestamp on save
metaIntegrationSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

// Virtual for checking if token is expired
metaIntegrationSchema.virtual('isTokenExpired').get(function() {
    if (!this.tokenExpiresAt) return false;
    return new Date() > this.tokenExpiresAt;
});

module.exports = mongoose.model('MetaIntegration', metaIntegrationSchema);
