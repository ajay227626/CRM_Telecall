const aiGateway = require('./gateway');

/**
 * Analyzes call notes, agent comments, transcript, and optional audio recording.
 * Uses Gemini 2.5 Flash native multimodal understanding.
 * 
 * @param {object} params
 * @param {string} [params.callNotes]
 * @param {string} [params.transcript]
 * @param {Buffer} [params.audioBuffer]
 * @param {string} [params.audioMimeType] e.g. 'audio/mp3', 'audio/wav', 'audio/ogg'
 * @param {string} [params.encryptedTenantKey]
 * @returns {Promise<object>} Structured analysis JSON
 */
async function analyzeCallRecord({ callNotes, transcript, audioBuffer, audioMimeType, encryptedTenantKey = null }) {
    const promptParts = [
        `You are the Telecall CRM Expert Call & Lead Intelligence Auditor for Ajay Web Services.
Analyze the provided phone call information (audio recording, transcript, or telecaller agent notes).
Evaluate caller interest, objections, sentiment, next steps, and provide a constructive coaching tip for the telecaller.

Output strictly valid JSON matching this schema:
{
  "summary": "Concise 2-sentence summary of the conversation and outcome",
  "customerSentiment": "positive" | "neutral" | "negative",
  "sentimentScore": <number between -1.0 and 1.0>,
  "leadIntent": "high" | "medium" | "low" | "none",
  "budgetMentionedINR": <number or null>,
  "detectedObjections": ["<objection string>", ...],
  "recommendedDisposition": "Demo Scheduled" | "Interested - Follow-up" | "Not Interested - Price" | "Wrong Number" | "Callback Requested" | "Converted" | "Lost",
  "actionItems": ["<action item string>", ...],
  "telecallerCoachingTip": "<1 concise, actionable tip for the agent to improve performance>"
}`
    ];

    if (callNotes) {
        promptParts.push(`Telecaller Notes: """${callNotes}"""`);
    }

    if (transcript) {
        promptParts.push(`Call Transcript: """${transcript}"""`);
    }

    // Multimodal audio ingestion if recording is provided
    if (audioBuffer && audioMimeType) {
        promptParts.push({
            inlineData: {
                data: Buffer.isBuffer(audioBuffer) ? audioBuffer.toString('base64') : String(audioBuffer),
                mimeType: audioMimeType
            }
        });
    }

    // If no context provided at all, return safe default
    if (!callNotes && !transcript && !audioBuffer) {
        return {
            summary: "No call notes, transcript, or audio recording was provided for analysis.",
            customerSentiment: "neutral",
            sentimentScore: 0.0,
            leadIntent: "none",
            budgetMentionedINR: null,
            detectedObjections: [],
            recommendedDisposition: "Callback Requested",
            actionItems: ["Obtain call notes or recording from telecaller"],
            telecallerCoachingTip: "Ensure call notes are filled immediately after dispositioning a call."
        };
    }

    const analysis = await aiGateway.generateStructuredJson(promptParts, {
        temperature: 0.2,
        encryptedTenantKey
    });

    return analysis;
}

module.exports = {
    analyzeCallRecord
};
