const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const requireProductEntitlement = require('../middleware/entitlementGuard');
const { requireAiEntitlement } = require('../ai/entitlementGate');
const { analyzeCallRecord } = require('../ai/callAnalyzer');
const { getTelecallerCopilotAdvice, streamTelecallerCopilotAdvice } = require('../ai/chatbotService');
const { encrypt } = require('../ai/crypto');
const CallLog = require('../models/CallLog');
const Lead = require('../models/Lead');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');

// Apply base CRM authentication and product entitlement
router.use(auth);
router.use(requireProductEntitlement('telecall-crm'));

/**
 * 1. POST /api/ai/analyze-call
 * Analyzes call notes, transcription, or audio recordings.
 * Subscription-gated via Central SLM entitlement engine.
 */
router.post('/analyze-call', async (req, res, next) => {
    // Dynamically check feature key based on payload
    const hasAudio = !!(req.body?.audioBase64 || req.body?.audioBuffer || req.body?.audioUrl);
    const featureKey = hasAudio ? 'audio_recording_analysis' : 'call_notes_analysis';
    return requireAiEntitlement(featureKey)(req, res, next);
}, async (req, res) => {
    try {
        const { callId, leadId, notes, transcript, audioBase64, audioMimeType } = req.body;

        // If audioBase64 is passed, convert to Buffer
        const audioBuffer = audioBase64 ? Buffer.from(audioBase64, 'base64') : null;

        // Check if tenant has encrypted BYOK key in settings
        let encryptedTenantKey = null;
        try {
            const orgId = req.tenantId || req.user?.currentOrganisationId || req.user?.organisationId;
            const aiSettings = await Settings.findOne({ organisationId: orgId, category: 'ai' });
            if (aiSettings?.data?.encryptedApiKey) {
                encryptedTenantKey = aiSettings.data.encryptedApiKey;
            }
        } catch (_) {}

        // Run AI Analysis via Gemini 2.5 Flash
        const analysis = await analyzeCallRecord({
            callNotes: notes,
            transcript,
            audioBuffer,
            audioMimeType: audioMimeType || (audioBuffer ? 'audio/mp3' : undefined),
            encryptedTenantKey
        });

        // Map sentimentScore (-1.0 to 1.0) to 0-100 score
        const normalizedScore = Math.min(100, Math.max(0, Math.round(((analysis.sentimentScore || 0) + 1) * 50)));

        // 1. Update CallLog record if callId provided
        let updatedCall = null;
        if (callId) {
            updatedCall = await CallLog.findByIdAndUpdate(callId, {
                aiStatus: 'completed',
                aiScore: normalizedScore,
                aiSummary: analysis.summary,
                aiAnalysis: {
                    ...analysis,
                    analyzedAt: new Date()
                },
                ...(notes && { notes }),
                // Propose disposition if current disposition is empty or default
                disposition: analysis.recommendedDisposition
            }, { new: true });
        }

        // 2. Update Lead record if leadId provided
        let updatedLead = null;
        if (leadId) {
            const leadUpdate = {
                aiScore: normalizedScore,
                intentLevel: analysis.leadIntent || 'medium',
                lastSentiment: analysis.customerSentiment,
                statusChangedAt: new Date()
            };

            // If action items detected, append without duplicates
            if (analysis.actionItems && analysis.actionItems.length > 0) {
                leadUpdate.$addToSet = { actionItems: { $each: analysis.actionItems } };
            }

            // Auto-propose status if high conversion detected
            if (analysis.recommendedDisposition === 'Demo Scheduled' || analysis.recommendedDisposition === 'Converted') {
                leadUpdate.status = 'Qualified';
            }

            updatedLead = await Lead.findByIdAndUpdate(leadId, leadUpdate, { new: true });

            // 3. Automated Workflow Notification: High-value lead escalation
            if (analysis.leadIntent === 'high' && (analysis.budgetMentionedINR >= 50000 || analysis.sentimentScore > 0.6)) {
                try {
                    await Notification.create({
                        user: req.user._id,
                        organisationId: req.tenantId || req.user?.currentOrganisationId,
                        title: `High Intent Lead Flagged: ${updatedLead?.name || 'Prospect'}`,
                        message: `AI detected high purchase intent (Score: ${normalizedScore}/100) with budget: ₹${analysis.budgetMentionedINR || 'High'}. Action required.`,
                        type: 'warning',
                        read: false
                    });
                } catch (notifErr) {
                    console.warn('[AI Workflow] Notification creation error:', notifErr.message);
                }
            }
        }

        return res.json({
            success: true,
            analysis,
            call: updatedCall,
            lead: updatedLead,
            aiContext: req.aiContext
        });
    } catch (error) {
        console.error('[AI Analyze Call Error]:', error);
        return res.status(500).json({
            error: 'AI Call Analysis failed',
            details: error.message
        });
    }
});

/**
 * 2. POST /api/ai/copilot
 * Standard request/response for Telecaller Sales Copilot
 */
router.post('/copilot', requireAiEntitlement('telecaller_copilot'), async (req, res) => {
    try {
        const { currentCallContext, customerQuery } = req.body;
        if (!customerQuery || typeof customerQuery !== 'string') {
            return res.status(400).json({ error: 'customerQuery string is required' });
        }

        // Check if tenant has encrypted BYOK key
        let encryptedTenantKey = null;
        try {
            const orgId = req.tenantId || req.user?.currentOrganisationId || req.user?.organisationId;
            const aiSettings = await Settings.findOne({ organisationId: orgId, category: 'ai' });
            if (aiSettings?.data?.encryptedApiKey) {
                encryptedTenantKey = aiSettings.data.encryptedApiKey;
            }
        } catch (_) {}

        const advice = await getTelecallerCopilotAdvice({
            currentCallContext,
            customerQuery,
            encryptedTenantKey
        });

        return res.json({
            success: true,
            advice,
            aiContext: req.aiContext
        });
    } catch (error) {
        console.error('[AI Copilot Error]:', error);
        return res.status(500).json({
            error: 'Copilot query failed',
            details: error.message
        });
    }
});

/**
 * 3. POST /api/ai/copilot/stream
 * Server-Sent Events (SSE) streaming for real-time in-call objection assistance
 */
router.post('/copilot/stream', requireAiEntitlement('telecaller_copilot'), async (req, res) => {
    try {
        const { currentCallContext, customerQuery } = req.body;
        if (!customerQuery || typeof customerQuery !== 'string') {
            return res.status(400).json({ error: 'customerQuery string is required' });
        }

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering on reverse proxies

        let encryptedTenantKey = null;
        try {
            const orgId = req.tenantId || req.user?.currentOrganisationId || req.user?.organisationId;
            const aiSettings = await Settings.findOne({ organisationId: orgId, category: 'ai' });
            if (aiSettings?.data?.encryptedApiKey) {
                encryptedTenantKey = aiSettings.data.encryptedApiKey;
            }
        } catch (_) {}

        const stream = await streamTelecallerCopilotAdvice({
            currentCallContext,
            customerQuery,
            encryptedTenantKey
        });

        for await (const chunk of stream) {
            const textChunk = chunk.text();
            res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
        }

        res.write('data: [DONE]\n\n');
        res.end();
    } catch (error) {
        console.error('[AI Copilot Stream Error]:', error);
        if (!res.headersSent) {
            return res.status(500).json({ error: 'Streaming copilot failed', details: error.message });
        }
        res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
        res.end();
    }
});

/**
 * 4. POST /api/ai/byok/save
 * Securely encrypts and saves tenant BYOK Gemini key
 */
router.post('/byok/save', async (req, res) => {
    try {
        const { apiKey } = req.body;
        if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
            return res.status(400).json({ error: 'Valid API Key string required' });
        }

        const orgId = req.tenantId || req.user?.currentOrganisationId || req.user?.organisationId;
        const encrypted = encrypt(apiKey.trim());

        await Settings.findOneAndUpdate(
            { organisationId: orgId, category: 'ai' },
            {
                organisationId: orgId,
                category: 'ai',
                data: {
                    hasCustomKey: true,
                    encryptedApiKey: encrypted,
                    updatedAt: new Date()
                }
            },
            { upsert: true, new: true }
        );

        return res.json({
            success: true,
            message: 'Tenant BYOK API Key encrypted and saved securely with AES-256-GCM.'
        });
    } catch (error) {
        return res.status(500).json({ error: 'Failed to save BYOK key', details: error.message });
    }
});

/**
 * 5. GET /api/ai/status
 * Returns current status of AI services and entitlement snapshot
 */
router.get('/status', requireAiEntitlement('call_notes_analysis'), async (req, res) => {
    return res.json({
        status: 'operational',
        model: 'gemini-2.5-flash',
        multimodalAudio: true,
        copilotStreaming: true,
        aiContext: req.aiContext
    });
});

module.exports = router;
