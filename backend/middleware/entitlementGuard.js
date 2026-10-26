/**
 * Central SLM Entitlement Guard Middleware
 *
 * Verifies that the authenticated user or active organisation possesses an active entitlement
 * to access 'telecall-crm' (or specified product).
 */

const CHECKOUT_BASE_URL = 'https://apps.ajaywebservices.in/billing/checkout';
const DEFAULT_PRODUCT = 'telecall-crm';

/**
 * Creates an entitlement guard for a specific product code.
 * @param {string} product - Entitlement identifier required (default: 'telecall-crm')
 */
const requireEntitlement = (product = DEFAULT_PRODUCT) => {
  return (req, res, next) => {
    // 1. Allow environment bypass if explicitly disabled for local testing
    if (process.env.SLM_DISABLE_ENTITLEMENT_CHECK === 'true') {
      return next();
    }

    // 2. Allow SuperAdmin role global bypass
    const userRole = (req.user?.systemRole || req.user?.role || '').toLowerCase();
    if (userRole === 'superadmin') {
      return next();
    }

    // 3. Collect entitlements from session, user, and decoded claims
    const sessionEntitlements = req.sessionData?.entitlements || [];
    const userEntitlements = req.user?.entitlements || [];
    const claimEntitlements = req.claims?.entitlements || req.claims?.products || [];

    const allEntitlements = new Set([
      ...sessionEntitlements,
      ...userEntitlements,
      ...claimEntitlements
    ].map(e => (typeof e === 'string' ? e.toLowerCase().trim() : '')));

    // Supported entitlement identifiers for Telecall CRM
    const validMatches = [
      product.toLowerCase(),
      'telecall-crm',
      'crm-telecall',
      'telecall',
      'all-apps',
      'all-access',
      'enterprise-suite'
    ];

    const hasEntitlement = validMatches.some(id => allEntitlements.has(id));

    if (hasEntitlement) {
      return next();
    }

    // 4. Missing or expired entitlement -> 403 Forbidden with SUBSCRIPTION_REQUIRED
    const checkoutUrl = `${CHECKOUT_BASE_URL}?product=${encodeURIComponent(product)}`;

    return res.status(403).json({
      success: false,
      code: 'SUBSCRIPTION_REQUIRED',
      error: 'SUBSCRIPTION_REQUIRED',
      message: `An active subscription to Telecall CRM (${product}) is required.`,
      checkoutUrl
    });
  };
};

module.exports = requireEntitlement;
module.exports.entitlementGuard = requireEntitlement();
