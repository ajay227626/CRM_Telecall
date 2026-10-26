const aiGateway = require('./gateway');

const COPILOT_SYSTEM_INSTRUCTION = `You are the real-time Telecaller Sales Copilot for Ajay Web Services ecosystem.
Your job is to provide the human telecaller with instant, high-converting objection handling, discovery questions, and exact phrases to close deals or schedule demos.

Rules:
1. Keep responses extremely concise (2-3 short bullet points maximum).
2. Format:
   - 🎯 Key Angle (Value proposition, GST compliance, SLA guarantees, or pricing clarity)
   - 🗣️ What to Say (The exact sentence the telecaller should speak next)
3. Maintain a consultative, polite, yet confident B2B sales tone.`;

/**
 * Standard Telecaller Copilot response
 * @param {object} params
 * @param {object} params.currentCallContext (lead info, previous notes, status)
 * @param {string} params.customerQuery (what the prospect just said or objection)
 * @param {string} [params.encryptedTenantKey]
 * @returns {Promise<string>}
 */
async function getTelecallerCopilotAdvice({ currentCallContext, customerQuery, encryptedTenantKey = null }) {
    const history = [
        {
            role: 'user',
            parts: [{ text: `Lead & Call Context: ${JSON.stringify(currentCallContext || {})}` }]
        },
        {
            role: 'model',
            parts: [{ text: 'Ready. What did the prospect just say or what objection arose?' }]
        }
    ];

    const advice = await aiGateway.generateCopilotResponse(
        COPILOT_SYSTEM_INSTRUCTION,
        customerQuery,
        history,
        { encryptedTenantKey, temperature: 0.3 }
    );

    return advice;
}

/**
 * Streamed Telecaller Copilot response for low-latency SSE
 * @param {object} params
 * @returns {Promise<AsyncIterable<any>>}
 */
async function streamTelecallerCopilotAdvice({ currentCallContext, customerQuery, encryptedTenantKey = null }) {
    const history = [
        {
            role: 'user',
            parts: [{ text: `Lead & Call Context: ${JSON.stringify(currentCallContext || {})}` }]
        },
        {
            role: 'model',
            parts: [{ text: 'Ready. What did the prospect just say or what objection arose?' }]
        }
    ];

    return aiGateway.streamCopilotResponse(
        COPILOT_SYSTEM_INSTRUCTION,
        customerQuery,
        history,
        { encryptedTenantKey, temperature: 0.3 }
    );
}

module.exports = {
    getTelecallerCopilotAdvice,
    streamTelecallerCopilotAdvice
};
