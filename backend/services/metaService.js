const axios = require('axios');

const GRAPH_API_VERSION = 'v21.0';
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

class MetaService {
    /**
     * Generate OAuth URL for user to connect Meta account
     */
    static getAuthUrl(redirectUri, state) {
        const appId = process.env.META_APP_ID;
        const scopes = [
            'leads_retrieval',
            'pages_manage_ads',
            'pages_show_list',
            'pages_read_engagement'
        ].join(',');

        const params = new URLSearchParams({
            client_id: appId,
            redirect_uri: redirectUri,
            state: state, // Use to identify user after redirect
            scope: scopes,
            response_type: 'code'
        });

        return `https://www.facebook.com/v21.0/dialog/oauth?${params.toString()}`;
    }

    /**
     * Exchange authorization code for access token
     */
    static async exchangeCodeForToken(code, redirectUri) {
        try {
            const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
                params: {
                    client_id: process.env.META_APP_ID,
                    client_secret: process.env.META_APP_SECRET,
                    redirect_uri: redirectUri,
                    code: code
                }
            });

            return response.data.access_token;
        } catch (error) {
            console.error('Meta token exchange error:', error.response?.data || error.message);
            throw new Error('Failed to exchange code for token');
        }
    }

    /**
     * Exchange short-lived token for long-lived token (60 days)
     */
    static async getLongLivedToken(shortToken) {
        try {
            const response = await axios.get(`${GRAPH_API_BASE}/oauth/access_token`, {
                params: {
                    grant_type: 'fb_exchange_token',
                    client_id: process.env.META_APP_ID,
                    client_secret: process.env.META_APP_SECRET,
                    fb_exchange_token: shortToken
                }
            });

            return {
                accessToken: response.data.access_token,
                expiresIn: response.data.expires_in
            };
        } catch (error) {
            console.error('Long-lived token error:', error.response?.data || error.message);
            throw new Error('Failed to get long-lived token');
        }
    }

    /**
     * Get user's Facebook pages
     */
    static async getUserPages(userAccessToken) {
        try {
            const response = await axios.get(`${GRAPH_API_BASE}/me/accounts`, {
                params: {
                    access_token: userAccessToken,
                    fields: 'id,name,access_token'
                }
            });

            return response.data.data;
        } catch (error) {
            console.error('Get user pages error:', error.response?.data || error.message);
            throw new Error('Failed to fetch user pages');
        }
    }

    /**
     * Subscribe page to leadgen webhooks
     */
    static async subscribePageToWebhook(pageId, pageAccessToken) {
        try {
            const response = await axios.post(
                `${GRAPH_API_BASE}/${pageId}/subscribed_apps`,
                {
                    subscribed_fields: ['leadgen']
                },
                {
                    params: {
                        access_token: pageAccessToken
                    }
                }
            );

            return response.data.success === true;
        } catch (error) {
            console.error('Subscribe webhook error:', error.response?.data || error.message);
            throw new Error('Failed to subscribe to webhooks');
        }
    }

    /**
     * Get lead forms for a page
     */
    static async getPageForms(pageId, pageAccessToken) {
        try {
            const response = await axios.get(`${GRAPH_API_BASE}/${pageId}/leadgen_forms`, {
                params: {
                    access_token: pageAccessToken,
                    fields: 'id,name,status,leads_count'
                }
            });

            return response.data.data;
        } catch (error) {
            console.error('Get page forms error:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Fetch lead data from Meta
     */
    static async getLeadData(leadId, pageAccessToken) {
        try {
            const response = await axios.get(`${GRAPH_API_BASE}/${leadId}`, {
                params: {
                    access_token: pageAccessToken,
                    fields: 'id,created_time,field_data,form_id'
                }
            });

            return response.data;
        } catch (error) {
            console.error('Get lead data error:', error.response?.data || error.message);
            throw new Error('Failed to fetch lead data');
        }
    }

    /**
     * Verify webhook signature from Meta
     */
    static verifyWebhookSignature(signature, body) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.META_APP_SECRET)
            .update(body)
            .digest('hex');

        return `sha256=${expectedSignature}` === signature;
    }

    /**
     * Verify webhook subscription (called by Meta during setup)
     */
    static verifyWebhook(mode, token, challenge) {
        const verifyToken = process.env.META_VERIFY_TOKEN;
        
        if (mode === 'subscribe' && token === verifyToken) {
            return challenge;
        }
        
        return null;
    }

    /**
     * Map Meta field data to CRM Lead format
     */
    static mapMetaLeadToLead(metaLead) {
        const fieldData = metaLead.field_data || [];
        
        // Extract fields from Meta format
        const fields = {};
        fieldData.forEach(field => {
            const name = field.name.toLowerCase();
            const values = field.values || [];
            const value = values.length > 0 ? values[0] : '';
            
            fields[name] = value;
        });

        // Map to CRM lead format
        return {
            name: fields.full_name || fields.name || 'Unknown',
            email: fields.email || fields.email_address || '',
            phone: fields.phone || fields.phone_number || fields.mobile || '',
            whatsapp: fields.whatsapp || fields.phone || '',
            category: 'Other', // Can be enhanced with field mapping
            source: 'Meta',
            status: 'New',
            metaLeadId: metaLead.id,
            metaFormId: metaLead.form_id,
            rawMetaData: metaLead
        };
    }
}

module.exports = MetaService;
