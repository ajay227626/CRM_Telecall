const assert = require('assert');
const { encrypt, decrypt } = require('../server/ai/crypto');
const keyPool = require('../server/ai/keyPool');
const { requireAiEntitlement, quotaCache } = require('../server/ai/entitlementGate');

async function runTests() {
    console.log('=== STARTING AI GATEWAY & ENTITLEMENT ENGINE TEST SUITE ===\n');

    // -------------------------------------------------------------
    // Test Suite 1: AES-256-GCM Crypto Vault
    // -------------------------------------------------------------
    console.log('[Suite 1] AES-256-GCM Vault:');
    const secretKey = 'AIzaSyFakeSecretKeyForTestingGeminiRotation12345';
    const encrypted = encrypt(secretKey);
    console.log('  Encrypted payload:', encrypted);

    assert(encrypted.includes(':'), 'Encrypted string must contain colon separators');
    const parts = encrypted.split(':');
    assert.strictEqual(parts.length, 3, 'Encrypted format must be iv:authTag:encryptedHex');
    assert.strictEqual(parts[0].length, 24, 'IV hex must be 12 bytes (24 hex characters)');
    assert.strictEqual(parts[1].length, 32, 'Auth tag hex must be 16 bytes (32 hex characters)');

    const decrypted = decrypt(encrypted);
    assert.strictEqual(decrypted, secretKey, 'Decrypted text must match original secret key');
    console.log('  ✔ Test 1.1 Passed: Clean encrypt and decrypt cycle verified');

    // Tamper detection (authenticated encryption)
    let tampered = parts[0] + ':' + parts[1] + ':' + parts[2].slice(0, -2) + 'ff';
    assert.throws(() => {
        decrypt(tampered);
    }, 'Tampered ciphertext must fail authentication and throw');
    console.log('  ✔ Test 1.2 Passed: Tamper detection & auth tag verification confirmed');

    // -------------------------------------------------------------
    // Test Suite 2: KeyPool Rotation & Health Tracking
    // -------------------------------------------------------------
    console.log('\n[Suite 2] KeyPool Multi-Key Rotation & BYOK Priority:');
    process.env.GEMINI_API_KEY = 'key_alpha_111,key_beta_222,key_gamma_333';

    // 1. Check healthy key selection
    const k1 = keyPool.getKey();
    const k2 = keyPool.getKey();
    assert(k1 && k2, 'Keys must be returned from pool');
    assert.notStrictEqual(k1, k2, 'Key pool must rotate across different keys');
    console.log(`  ✔ Test 2.1 Passed: Round-robin rotation active (${k1} -> ${k2})`);

    // 2. Check BYOK precedence
    const tenantCustomKey = 'custom_tenant_byok_key_999';
    const encryptedTenantKey = encrypt(tenantCustomKey);
    const selectedTenantKey = keyPool.getKey(encryptedTenantKey);
    assert.strictEqual(selectedTenantKey, tenantCustomKey, 'Tenant BYOK key must take precedence over platform pool');
    console.log('  ✔ Test 2.2 Passed: Tenant BYOK key priority verified');

    // 3. Check 429 rate-limit cooldown
    keyPool.recordFailure(k1, { status: 429, message: 'RESOURCE_EXHAUSTED' });
    const kAfterFailure = keyPool.getKey();
    assert.notStrictEqual(kAfterFailure, k1, 'Key in 429 cooldown must not be returned while alternative keys exist');
    console.log('  ✔ Test 2.3 Passed: 429 rate-limit cooldown and avoidance verified');

    // -------------------------------------------------------------
    // Test Suite 3: Central SLM Entitlement Gating & Fallbacks
    // -------------------------------------------------------------
    console.log('\n[Suite 3] Central SLM Entitlement Gate & Graceful Fallback:');
    quotaCache.clear();

    // 1. SuperAdmin Bypass
    const superAdminReq = {
        tenantId: 'org_test_123',
        user: { systemRole: 'SuperAdmin' },
        sessionData: { role: 'SuperAdmin', entitlements: ['*'] }
    };
    let superAdminPassed = false;
    const gateFn = requireAiEntitlement('audio_recording_analysis');
    await gateFn(superAdminReq, {}, () => { superAdminPassed = true; });
    assert(superAdminPassed, 'SuperAdmin must bypass entitlement restrictions');
    assert.strictEqual(superAdminReq.aiContext?.tier, 'Enterprise (SuperAdmin)');
    console.log('  ✔ Test 3.1 Passed: Platform SuperAdmin bypass confirmed');

    // 2. In-memory 30s TTL cache hit
    quotaCache.set('org_cached_test:call_notes_analysis', {
        allowed: true,
        tier: 'Growth',
        limits: { maxAudioMinutesPerCall: 15, monthlyQuota: 50000 },
        remainingQuota: 45000,
        expiresAt: Date.now() + 25000
    });

    const cachedReq = {
        tenantId: 'org_cached_test',
        headers: {},
        user: { systemRole: 'User', currentOrganisationId: 'org_cached_test' }
    };
    let cachePassed = false;
    await requireAiEntitlement('call_notes_analysis')(cachedReq, {}, () => { cachePassed = true; });
    assert(cachePassed, 'Cached active entitlement must pass immediately without network roundtrip');
    assert.strictEqual(cachedReq.aiContext?.tier, 'Growth');
    console.log('  ✔ Test 3.2 Passed: 30s in-memory TTL quota cache hit verified');

    // 3. High-cost Pro feature fail-closed when Central SLM is unreachable
    let failClosedStatus = null;
    let failClosedBody = null;
    const mockRes = {
        status: (code) => {
            failClosedStatus = code;
            return {
                json: (data) => { failClosedBody = data; }
            };
        }
    };

    const unreachableReq = {
        tenantId: 'org_unreachable_999',
        headers: {},
        user: { systemRole: 'User' },
        sessionData: { entitlements: ['telecall-crm'] } // Has basic CRM, but audio is Pro
    };

    // Attempting heavy audio recording analysis when SLM cannot be reached:
    await requireAiEntitlement('audio_recording_analysis')(unreachableReq, mockRes, () => {});
    assert.strictEqual(failClosedStatus, 503, 'High-cost audio analysis must fail-closed with 503 when SLM is unreachable');
    assert.strictEqual(failClosedBody?.code, 'CENTRAL_SLM_UNAVAILABLE');
    console.log('  ✔ Test 3.3 Passed: High-cost audio analysis fail-closed (503) verified');

    // 4. Basic feature soft-pass when Central SLM is unreachable and session has product entitlement (< 500 chars)
    let softPassNext = false;
    unreachableReq.body = { notes: 'Brief summary: Client asked for follow-up tomorrow at 2 PM.' }; // < 500 chars
    await requireAiEntitlement('call_notes_analysis')(unreachableReq, mockRes, () => {
        softPassNext = true;
    });
    assert(softPassNext, 'Basic text note summarization (<500 chars) must soft-pass under active telecall-crm session entitlement');
    assert.strictEqual(unreachableReq.aiContext?.isFallback, true);
    console.log('  ✔ Test 3.4 Passed: Basic note summarization (<500 chars) soft-pass on SLM downtime verified');

    // 5. Basic feature rejection when SLM is unreachable and note exceeds 500 chars
    let overLimitStatus = null;
    let overLimitBody = null;
    const overLimitRes = {
        status: (code) => {
            overLimitStatus = code;
            return {
                json: (data) => { overLimitBody = data; }
            };
        }
    };
    unreachableReq.body = { notes: 'A'.repeat(501) }; // > 500 chars
    let overLimitPassed = false;
    await requireAiEntitlement('call_notes_analysis')(unreachableReq, overLimitRes, () => {
        overLimitPassed = true;
    });
    assert(!overLimitPassed, 'Notes exceeding 500 chars must NOT soft-pass during SLM outage');
    assert.strictEqual(overLimitStatus, 403);
    assert.strictEqual(overLimitBody?.code, 'FALLBACK_LIMIT_EXCEEDED');
    console.log('  ✔ Test 3.5 Passed: Note summarization (>500 chars) fail-closed during SLM downtime verified');

    console.log('\n========================================================');
    console.log('✅ ALL AI GATEWAY & ENTITLEMENT ENGINE TESTS PASSED!');
    console.log('========================================================');
}

runTests().catch(err => {
    console.error('❌ AI Engine Test Failed:', err);
    process.exit(1);
});
