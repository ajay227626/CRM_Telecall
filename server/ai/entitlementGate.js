const axios = require('axios');

const SLM_ORIGIN = process.env.SLM_ISSUER || process.env.SLM_BASE_URL || 'https://app.ajaywebservices.in';

// In-memory 30s TTL cache to avoid hitting Central SLM on every single AI keystroke
// Key: `${orgId}:${featureKey}` -> { allowed, tier, limits, remainingQuota, reason, expiresAt }
const quotaCache = new Map();

// High-cost features that MUST fail-closed if Central SLM is unreachable
const PRO_ENTERPRISE_FEATURES = new Set([
    'audio_recording_analysis',
    'telecaller_copilot',
    'telecaller_copilot_stream',
    'lead_churn_prediction'
]);

/**
 * Middleware factory for subscription & entitlement gating against Central SLM.
 * @param {string} featureKey e.g. 'call_notes_analysis', 'audio_recording_analysis', 'telecaller_copilot'
 */
function requireAiEntitlement(featureKey) {
    return async function (req, res, next) {
        const orgId = req.tenantId || req.organisationId || req.headers['x-organisation-id'] || req.user?.currentOrganisationId || req.user?.organisationId || req.sessionData?.organisationId;

        // 1. Platform SuperAdmin / Developer Bypass
        const isSuperAdmin =
            req.user?.systemRole === 'SuperAdmin' ||
            req.sessionData?.role === 'SuperAdmin' ||
            req.sessionData?.role === 'developer' ||
            req.user?.role === 'developer' ||
            (req.sessionData?.entitlements && (
                req.sessionData.entitlements.includes('*') ||
                req.sessionData.entitlements.includes('all-apps')
            ));

        if (isSuperAdmin) {
            req.aiContext = {
                tier: 'Enterprise (SuperAdmin)',
                limits: { maxAudioMinutesPerCall: 60, monthlyQuota: Infinity },
                remainingQuota: Infinity,
                isSuperAdmin: true
            };
            return next();
        }

        if (!orgId) {
            return res.status(400).json({
                error: 'Organisation identifier required for AI entitlement check',
                code: 'MISSING_ORG'
            });
        }

        const effectiveFeatureKey = featureKey || req.body?.featureType || 'call_notes_analysis';
        const cacheKey = `${orgId}:${effectiveFeatureKey}`;
        const now = Date.now();

        // 2. Check local in-memory cache
        const cached = quotaCache.get(cacheKey);
        if (cached && cached.expiresAt > now) {
            if (!cached.allowed) {
                return res.status(403).json({
                    error: cached.reason || `AI feature [${effectiveFeatureKey}] is not permitted on current plan or quota exhausted.`,
                    code: 'FEATURE_GATED',
                    upgradeUrl: 'https://apps.ajaywebservices.in/billing/checkout?product=crm-telecall'
                });
            }
            req.aiContext = {
                tier: cached.tier,
                limits: cached.limits,
                remainingQuota: cached.remainingQuota
            };
            return next();
        }

        // 3. Authoritative verification against Central SLM
        const authHeader = req.headers.authorization || (req.cookies?.crm_session ? `Bearer ${req.cookies.crm_session}` : '');

        try {
            const response = await axios.post(
                `${SLM_ORIGIN}/api/v1/ecosystem/entitlements/verify`,
                {
                    organisationId: orgId,
                    productKey: 'telecall-crm',
                    featureKey: effectiveFeatureKey
                },
                {
                    headers: {
                        ...(authHeader && { Authorization: authHeader }),
                        'Content-Type': 'application/json'
                    },
                    timeout: 4000 // 4s timeout
                }
            );

            const { allowed, tier, limits, remainingQuota } = response.data || {};

            // Cache result for 30 seconds
            quotaCache.set(cacheKey, {
                allowed: !!allowed,
                tier: tier || 'Starter',
                limits: limits || {},
                remainingQuota: typeof remainingQuota === 'number' ? remainingQuota : 0,
                reason: allowed ? null : `AI feature [${effectiveFeatureKey}] is not permitted on the ${tier || 'Starter'} tier or monthly quota is exhausted.`,
                expiresAt: now + 30000
            });

            if (!allowed) {
                return res.status(403).json({
                    error: `AI feature [${effectiveFeatureKey}] is not permitted on the ${tier || 'Starter'} tier or monthly quota is exhausted.`,
                    code: 'FEATURE_GATED',
                    tier: tier || 'Starter',
                    upgradeUrl: 'https://apps.ajaywebservices.in/billing/checkout?product=crm-telecall'
                });
            }

            req.aiContext = {
                tier: tier || 'Starter',
                limits: limits || {},
                remainingQuota: typeof remainingQuota === 'number' ? remainingQuota : 0
            };
            return next();
        } catch (err) {
            console.warn(`[EntitlementGate] Central SLM verify connectivity issue for ${effectiveFeatureKey}:`, err.message);

            // 4. Graceful Fallback Strategy
            // A. High-cost Pro/Enterprise features -> Fail-closed to protect platform budget
            if (PRO_ENTERPRISE_FEATURES.has(effectiveFeatureKey)) {
                return res.status(503).json({
                    error: 'Central subscription service is temporarily unavailable. High-cost AI operations are paused.',
                    code: 'CENTRAL_SLM_UNAVAILABLE',
                    retryAfter: 30
                });
            }

            // B. Basic features (e.g. text note summarization under 500 chars) ->
            // Allow soft-pass if session or user entitlements already include telecall-crm
            const hasBaseEntitlement =
                req.sessionData?.entitlements?.includes('telecall-crm') ||
                req.user?.entitlements?.includes('telecall-crm') ||
                req.sessionData?.entitlements?.includes('all-apps') ||
                req.user?.entitlements?.includes('all-apps');

            if (hasBaseEntitlement) {
                const textContent = req.body?.notes || req.body?.transcript || req.body?.content || '';
                const textLength = typeof textContent === 'string' ? textContent.length : 0;

                // Enforce maximum 500 chars for unverified fallback summarization
                if (effectiveFeatureKey === 'call_notes_analysis' && textLength > 500) {
                    return res.status(403).json({
                        error: 'Central subscription service is temporarily unavailable and note length exceeds the 500-character fallback limit.',
                        code: 'FALLBACK_LIMIT_EXCEEDED'
                    });
                }

                console.log(`[EntitlementGate] Soft-pass granted for basic feature [${effectiveFeatureKey}] under existing telecall-crm entitlement.`);
                req.aiContext = {
                    tier: 'Starter (Fallback)',
                    limits: { maxAudioMinutesPerCall: 0, monthlyQuota: 1000 },
                    remainingQuota: 100,
                    isFallback: true
                };
                return next();
            }

            // If no existing session entitlement exists, fail closed with 403
            return res.status(403).json({
                error: 'Unable to verify AI entitlements with Central SLM and no active product entitlement cached in session.',
                code: 'CENTRAL_SLM_UNAVAILABLE'
            });
        }
    };
}

module.exports = {
    requireAiEntitlement,
    quotaCache
};
