const { GoogleGenerativeAI } = require('@google/generative-ai');
const keyPool = require('./keyPool');

/**
 * Unified AI Gateway Runner with multi-key pool rotation and retry capabilities.
 */
class AiGateway {
    constructor() {
        this.defaultModel = 'gemini-2.5-flash';
    }

    /**
     * Executes an operation with automatic key rotation on 429/quota errors
     * @param {Function} operationFn (genAI, apiKey) => Promise<any>
     * @param {string|null} encryptedTenantKey
     * @returns {Promise<any>}
     */
    async executeWithKey(operationFn, encryptedTenantKey = null) {
        let attempts = 0;
        const maxAttempts = 3;
        let lastError = null;

        while (attempts < maxAttempts) {
            attempts++;
            const apiKey = keyPool.getKey(encryptedTenantKey);
            const genAI = new GoogleGenerativeAI(apiKey);

            try {
                const result = await operationFn(genAI, apiKey);
                keyPool.recordSuccess(apiKey);
                return result;
            } catch (err) {
                lastError = err;
                keyPool.recordFailure(apiKey, err);

                // If error is 429 rate limit or quota exceeded, retry immediately with next key
                const isRateLimit = err?.status === 429 ||
                    (err?.message && (
                        err.message.includes('429') ||
                        err.message.includes('RESOURCE_EXHAUSTED') ||
                        err.message.includes('quota')
                    ));

                if (isRateLimit && attempts < maxAttempts) {
                    console.warn(`[AiGateway] Attempt ${attempts} failed with rate-limit, rotating to next key...`);
                    continue;
                }

                // If non-recoverable error, break
                break;
            }
        }

        throw lastError;
    }

    /**
     * Generates structured JSON output from Gemini 2.5 Flash
     * @param {Array<string|object>} promptParts
     * @param {object} options
     * @returns {Promise<any>} Parsed JSON
     */
    async generateStructuredJson(promptParts, options = {}) {
        return this.executeWithKey(async (genAI) => {
            const modelName = options.model || this.defaultModel;
            const model = genAI.getGenerativeModel({
                model: modelName,
                generationConfig: {
                    responseMimeType: 'application/json',
                    temperature: typeof options.temperature === 'number' ? options.temperature : 0.2
                }
            });

            const result = await model.generateContent(promptParts);
            const text = result.response.text();
            try {
                return JSON.parse(text);
            } catch (jsonErr) {
                // If model wrapped json in markdown code fences, clean it
                const cleaned = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
                return JSON.parse(cleaned);
            }
        }, options.encryptedTenantKey);
    }

    /**
     * In-call Copilot response generation
     * @param {string} systemInstruction
     * @param {string} userMessage
     * @param {Array} history
     * @param {object} options
     * @returns {Promise<string>}
     */
    async generateCopilotResponse(systemInstruction, userMessage, history = [], options = {}) {
        return this.executeWithKey(async (genAI) => {
            const modelName = options.model || this.defaultModel;
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction || undefined,
                generationConfig: {
                    temperature: typeof options.temperature === 'number' ? options.temperature : 0.4,
                    maxOutputTokens: 600
                }
            });

            const chat = model.startChat({ history });
            const response = await chat.sendMessage(userMessage);
            return response.response.text();
        }, options.encryptedTenantKey);
    }

    /**
     * Streams Copilot tokens for zero-latency SSE delivery
     * @param {string} systemInstruction
     * @param {string} userMessage
     * @param {Array} history
     * @param {object} options
     * @returns {Promise<AsyncIterable<any>>}
     */
    async streamCopilotResponse(systemInstruction, userMessage, history = [], options = {}) {
        return this.executeWithKey(async (genAI) => {
            const modelName = options.model || this.defaultModel;
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: systemInstruction || undefined,
                generationConfig: {
                    temperature: typeof options.temperature === 'number' ? options.temperature : 0.4,
                    maxOutputTokens: 600
                }
            });

            const chat = model.startChat({ history });
            const streamResult = await chat.sendMessageStream(userMessage);
            return streamResult.stream;
        }, options.encryptedTenantKey);
    }
}

const aiGateway = new AiGateway();
module.exports = aiGateway;
