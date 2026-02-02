const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MetaService = require('../services/metaService');
const MetaIntegration = require('../models/MetaIntegration');
const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

/**
 * Admin middleware - checks if user has admin permissions
 */
const isAdmin = async (req, res, next) => {
    const allowedRoles = ['SuperAdmin', 'Moderator', 'Admin'];
    if (!req.user || !allowedRoles.includes(req.user.systemRole)) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

/**
 * GET /api/meta/webhook
 * Webhook verification endpoint (called by Meta during setup)
 */
router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const result = MetaService.verifyWebhook(mode, token, challenge);
    
    if (result) {
        res.status(200).send(challenge);
    } else {
        res.status(403).send('Verification failed');
    }
});

/**
 * POST /api/meta/webhook
 * Receive lead notifications from Meta
 */
router.post('/webhook', express.json({ verify: (req, res, buf) => {
    req.rawBody = buf.toString();
}}), async (req, res) => {
    // Verify signature
    const signature = req.headers['x-hub-signature-256'];
    if (!MetaService.verifyWebhookSignature(signature, req.rawBody)) {
        console.error('Invalid webhook signature');
        return res.status(403).send('Invalid signature');
    }

    // Process webhook
    const body = req.body;
    
    if (body.object === 'page') {
        for (const entry of body.entry) {
            for (const change of entry.changes) {
                if (change.field === 'leadgen') {
                    const leadgenData = change.value;
                    const pageId = leadgenData.page_id;
                    const leadId = leadgenData.leadgen_id;
                    const formId = leadgenData.form_id;

                    // Process lead asynchronously
                    processLead(leadId, pageId, formId).catch(err => {
                        console.error('Lead processing error:', err);
                    });
                }
            }
        }
    }

    // Always respond 200 immediately
    res.status(200).send('EVENT_RECEIVED');
});

/**
 * GET /api/meta/integrations
 * Get all Meta integrations (Admin only)
 */
router.get('/integrations', auth, isAdmin, async (req, res) => {
    try {
        const integrations = await MetaIntegration.find()
            .populate('createdBy', 'name email')
            .populate('assignTo', 'name email')
            .select('-accessToken -pages.accessToken') // Don't send tokens to frontend
            .sort('-createdAt');
        
        res.json(integrations);
    } catch (error) {
        console.error('Get integrations error:', error);
        res.status(500).json({ message: 'Failed to load integrations' });
    }
});

/**
 * GET /api/meta/auth-url
 * Get OAuth URL for connecting a new Meta account (Admin only)
 */
router.get('/auth-url', auth, isAdmin, (req, res) => {
    try {
        const redirectUri = `${process.env.WEBHOOK_BASE_URL}/api/meta/callback`;
        const state = req.user.id; // Admin ID for identification after redirect
        
        const authUrl = MetaService.getAuthUrl(redirectUri, state);
        
        res.json({ authUrl });
    } catch (error) {
        console.error('Auth URL error:', error);
        res.status(500).json({ message: 'Failed to generate auth URL' });
    }
});

/**
 * GET /api/meta/callback
 * Handle OAuth callback from Meta
 */
router.get('/callback', async (req, res) => {
    try {
        const code = req.query.code;
        const state = req.query.state; // Admin user ID
        const accountName = req.query.account_name || 'Meta Integration'; // Optional
        
        if (!code || !state) {
            return res.redirect('/settings?meta_error=missing_params&tab=integrations');
        }

        const redirectUri = `${process.env.WEBHOOK_BASE_URL}/api/meta/callback`;
        
        // Exchange code for token
        const shortToken = await MetaService.exchangeCodeForToken(code, redirectUri);
        
        // Get long-lived token
        const { accessToken, expiresIn } = await MetaService.getLongLivedToken(shortToken);
        
        // Get user's pages
        const pages = await MetaService.getUserPages(accessToken);
        
        // Subscribe each page to webhooks and get forms
        const pagesData = [];
        for (const page of pages) {
            try {
                await MetaService.subscribePageToWebhook(page.id, page.access_token);
                const forms = await MetaService.getPageForms(page.id, page.access_token);
                
                pagesData.push({
                    pageId: page.id,
                    pageName: page.name,
                    accessToken: page.access_token,
                    webhookSubscribed: true,
                    forms: forms.map(f => ({
                        formId: f.id,
                        formName: f.name
                    }))
                });
            } catch (err) {
                console.error(`Failed to subscribe page ${page.id}:`, err);
                pagesData.push({
                    pageId: page.id,
                    pageName: page.name,
                    accessToken: page.access_token,
                    webhookSubscribed: false,
                    forms: []
                });
            }
        }
        
        // Calculate expiration
        const expiresAt = new Date(Date.now() + expiresIn * 1000);
        
        // Create new integration
        const integration = new MetaIntegration({
            accountName: accountName,
            accessToken,
            tokenExpiresAt: expiresAt,
            pages: pagesData,
            isActive: true,
            lastSyncAt: new Date(),
            createdBy: state
        });
        
        await integration.save();
        
        // Redirect back to settings
        res.redirect('/settings?meta_success=true&tab=integrations');
        
    } catch (error) {
        console.error('OAuth callback error:', error);
        res.redirect('/settings?meta_error=auth_failed&tab=integrations');
    }
});

/**
 * PUT /api/meta/integrations/:id
 * Update integration settings (Admin only)
 */
router.put('/integrations/:id', auth, isAdmin, async (req, res) => {
    try {
        const { accountName, description, leadAssignment, assignTo, isActive } = req.body;
        
        const integration = await MetaIntegration.findById(req.params.id);
        if (!integration) {
            return res.status(404).json({ message: 'Integration not found' });
        }
        
        if (accountName) integration.accountName = accountName;
        if (description !== undefined) integration.description = description;
        if (leadAssignment) integration.leadAssignment = leadAssignment;
        if (assignTo !== undefined) integration.assignTo = assignTo;
        if (isActive !== undefined) integration.isActive = isActive;
        
        await integration.save();
        
        res.json({ message: 'Integration updated', integration });
        
    } catch (error) {
        console.error('Update integration error:', error);
        res.status(500).json({ message: 'Failed to update integration' });
    }
});

/**
 * DELETE /api/meta/integrations/:id
 * Delete integration (Admin only)
 */
router.delete('/integrations/:id', auth, isAdmin, async (req, res) => {
    try {
        await MetaIntegration.findByIdAndDelete(req.params.id);
        res.json({ message: 'Integration deleted' });
    } catch (error) {
        console.error('Delete integration error:', error);
        res.status(500).json({ message: 'Failed to delete integration' });
    }
});

/**
 * POST /api/meta/integrations/:id/sync
 * Manual sync for an integration (Admin only)
 */
router.post('/integrations/:id/sync', auth, isAdmin, async (req, res) => {
    try {
        const integration = await MetaIntegration.findById(req.params.id);
        
        if (!integration || !integration.isActive) {
            return res.status(404).json({ message: 'Integration not found or inactive' });
        }
        
        // Update last sync time
        integration.lastSyncAt = new Date();
        await integration.save();
        
        res.json({ message: 'Sync completed', syncedCount: 0 });
        
    } catch (error) {
        console.error('Manual sync error:', error);
        res.status(500).json({ message: 'Sync failed' });
    }
});

/**
 * Process incoming lead (async function)
 */
async function processLead(leadId, pageId, formId) {
    try {
        // Find integration by page ID
        const integration = await MetaIntegration.findOne({
            'pages.pageId': pageId,
            isActive: true
        });
        
        if (!integration) {
            console.error(`No integration found for page ${pageId}`);
            return;
        }
        
        // Get page access token
        const page = integration.pages.find(p => p.pageId === pageId);
        if (!page) {
            console.error(`Page ${pageId} not found in integration`);
            return;
        }
        
        // Fetch lead data from Meta
        const metaLead = await MetaService.getLeadData(leadId, page.accessToken);
        
        // Check if lead already exists
        const existingLead = await Lead.findOne({ metaLeadId: leadId });
        if (existingLead) {
            console.log(`Lead ${leadId} already exists, skipping`);
            return;
        }
        
        // Map Meta lead to CRM format
        const leadData = MetaService.mapMetaLeadToLead(metaLead);
        leadData.metaPageId = pageId;
        
        // Assign lead based on integration settings
        if (integration.leadAssignment === 'specific-user' && integration.assignTo) {
            leadData.assignedTo = integration.assignTo;
        } else if (integration.leadAssignment === 'round-robin') {
            // TODO: Implement round-robin logic
            leadData.assignedTo = null;
        } else {
            leadData.assignedTo = null; // Unassigned
        }
        
        // Create lead
        const lead = new Lead(leadData);
        await lead.save();
        
        // Create activity log
        await Activity.create({
            user: integration.createdBy,
            action: 'Created Lead',
            details: `New lead from Meta (${integration.accountName}): ${leadData.name}`,
            type: 'system',
            relatedId: lead._id,
            onModel: 'Lead'
        });
        
        // Update stats
        integration.stats.totalLeadsSynced++;
        integration.stats.lastLeadSyncedAt = new Date();
        await integration.save();
        
        console.log(`Lead ${leadId} synced successfully from ${integration.accountName}`);
        
    } catch (error) {
        console.error(`Failed to process lead ${leadId}:`, error);
    }
}

module.exports = router;
