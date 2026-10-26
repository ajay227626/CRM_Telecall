const { decrypt } = require('./crypto');

/**
 * Key Pool Manager with Multi-Key Rotation, 429 Cooldown & Health Tracking.
 */
class KeyPool {
    constructor() {
        this.cooldownDurationMs = 60 * 1000; // 60 seconds cooldown on 429
        this.keyStates = new Map(); // key -> { consecutiveErrors, cooldownUntil, lastUsed }
        this.currentIndex = 0;
    }

    /**
     * Parses platform keys from environment
     */
    getPlatformKeys() {
        const raw = process.env.GEMINI_API_KEY || '';
        return raw.split(',')
            .map(k => k.trim())
            .filter(k => k.length > 0);
    }

    /**
     * Selects an active key. Prioritizes tenant-provided BYOK key if supplied, otherwise rotates through the healthy platform key pool.
     * @param {string|null} encryptedTenantKey 
     * @returns {string} Plaintext API key
     */
    getKey(encryptedTenantKey = null) {
        // 1. If tenant has configured their own encrypted BYOK key, decrypt and prioritize it
        if (encryptedTenantKey) {
            try {
                const decrypted = decrypt(encryptedTenantKey);
                if (decrypted && decrypted.trim().length > 0) {
                    return decrypted.trim();
                }
            } catch (err) {
                console.warn('[KeyPool] Failed to decrypt tenant BYOK key, falling back to platform pool:', err.message);
            }
        }

        // 2. Select from platform key pool
        const keys = this.getPlatformKeys();
        if (keys.length === 0) {
            throw new Error('KeyPool Error: No GEMINI_API_KEY configured in environment');
        }

        const now = Date.now();
        // Check for healthy keys not currently in cooldown
        for (let i = 0; i < keys.length; i++) {
            const idx = (this.currentIndex + i) % keys.length;
            const candidate = keys[idx];
            const state = this.keyStates.get(candidate);

            if (!state || state.cooldownUntil <= now) {
                this.currentIndex = (idx + 1) % keys.length;
                this.keyStates.set(candidate, {
                    consecutiveErrors: state ? state.consecutiveErrors : 0,
                    cooldownUntil: 0,
                    lastUsed: now
                });
                return candidate;
            }
        }

        // If all keys are in cooldown, pick the one whose cooldown expires soonest
        let bestKey = keys[0];
        let earliestCooldown = Infinity;
        for (const candidate of keys) {
            const state = this.keyStates.get(candidate);
            const cooldown = state ? state.cooldownUntil : 0;
            if (cooldown < earliestCooldown) {
                earliestCooldown = cooldown;
                bestKey = candidate;
            }
        }

        console.warn(`[KeyPool] All keys in cooldown. Using key with earliest expiration in ${Math.max(0, earliestCooldown - now)}ms`);
        return bestKey;
    }

    /**
     * Records a successful execution on a key
     * @param {string} key 
     */
    recordSuccess(key) {
        if (!key) return;
        const state = this.keyStates.get(key) || { consecutiveErrors: 0, cooldownUntil: 0 };
        state.consecutiveErrors = 0;
        state.cooldownUntil = 0;
        this.keyStates.set(key, state);
    }

    /**
     * Records an error on a key. Triggers cooldown on 429 / RESOURCE_EXHAUSTED.
     * @param {string} key 
     * @param {Error|any} error 
     */
    recordFailure(key, error) {
        if (!key) return;
        const state = this.keyStates.get(key) || { consecutiveErrors: 0, cooldownUntil: 0 };
        state.consecutiveErrors += 1;

        const isRateLimit = error?.status === 429 ||
            (error?.message && (
                error.message.includes('429') ||
                error.message.includes('RESOURCE_EXHAUSTED') ||
                error.message.includes('quota')
            ));

        if (isRateLimit) {
            state.cooldownUntil = Date.now() + this.cooldownDurationMs;
            console.warn(`[KeyPool] Rate limit detected for key ending in ...${key.slice(-4)}. Placed in cooldown for ${this.cooldownDurationMs / 1000}s`);
        }

        this.keyStates.set(key, state);
    }
}

// Export singleton instance
const keyPool = new KeyPool();
module.exports = keyPool;
