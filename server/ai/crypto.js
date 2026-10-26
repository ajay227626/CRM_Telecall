const crypto = require('crypto');

/**
 * AES-256-GCM Cryptographic Vault for BYOK API keys & Sensitive AI Settings.
 * Format: ivHex:authTagHex:encryptedHex
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // Standard 96-bit IV for GCM
const AUTH_TAG_LENGTH = 16; // Standard 128-bit authentication tag

function getDerivedKey() {
    const rawSecret = process.env.AI_ENCRYPTION_SECRET || process.env.JWT_SECRET || 'crm_telecall_ai_encryption_fallback_secret_key_2026';
    // Derive exactly 32 bytes using SHA-256
    return crypto.createHash('sha256').update(rawSecret).digest();
}

/**
 * Encrypt plaintext string with AES-256-GCM
 * @param {string} text 
 * @returns {string} ivHex:authTagHex:encryptedHex
 */
function encrypt(text) {
    if (!text || typeof text !== 'string') {
        throw new Error('Encryption error: Text must be a non-empty string');
    }

    const key = getDerivedKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt AES-256-GCM string
 * @param {string} encryptedPayload ivHex:authTagHex:encryptedHex
 * @returns {string} Plaintext
 */
function decrypt(encryptedPayload) {
    if (!encryptedPayload || typeof encryptedPayload !== 'string') {
        throw new Error('Decryption error: Encrypted payload must be a non-empty string');
    }

    const parts = encryptedPayload.split(':');
    if (parts.length !== 3) {
        throw new Error('Decryption error: Invalid payload format (expected iv:authTag:encrypted)');
    }

    const [ivHex, authTagHex, encryptedHex] = parts;
    const key = getDerivedKey();
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = {
    encrypt,
    decrypt
};
