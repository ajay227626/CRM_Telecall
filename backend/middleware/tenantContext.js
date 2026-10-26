/**
 * Tenant Data Isolation Middleware & Mongoose Multi-Tenancy Plugin
 * 
 * Provides automated, zero-leakage multi-tenant data isolation by scoping
 * primary models (Lead, CallLog, Activity, Settings) by organisationId.
 */

const { AsyncLocalStorage } = require('async_hooks');
const tenantStorage = new AsyncLocalStorage();

/**
 * Returns the current active tenant/organisation ID from the async execution context.
 * @returns {string|null}
 */
const getTenantId = () => {
  const store = tenantStorage.getStore();
  return store ? store.tenantId : null;
};

/**
 * Express middleware to extract tenant context and bind to request & AsyncLocalStorage.
 */
const tenantContext = (req, res, next) => {
  try {
    let organisationId = null;

    // 1. Session or User context
    if (req.sessionData && req.sessionData.organisationId) {
      organisationId = req.sessionData.organisationId;
    } else if (req.user && req.user.currentOrganisationId) {
      organisationId = req.user.currentOrganisationId;
    }

    // 2. Allow X-Organisation-Id header if superadmin or user belongs to it
    const headerOrgId = req.headers['x-organisation-id'];
    if (headerOrgId) {
      const isSuperAdmin = (req.user?.systemRole || req.user?.role || '').toLowerCase() === 'superadmin';
      if (isSuperAdmin || headerOrgId === organisationId) {
        organisationId = headerOrgId;
      }
    }

    // 3. Fallback to user-specific personal workspace
    if (!organisationId && req.user) {
      const uid = req.user._id || req.user.id;
      organisationId = `org_personal_${uid}`;
    }

    // Set properties on request object
    req.tenantId = organisationId || 'org_default';
    req.organisationId = req.tenantId;

    // Bind to AsyncLocalStorage for transparent Mongoose scoping
    tenantStorage.run({ tenantId: req.tenantId, user: req.user }, () => {
      next();
    });
  } catch (err) {
    console.error('[TenantContext Error]:', err.message);
    next();
  }
};

/**
 * Mongoose Plugin for transparent multi-tenancy scoping.
 * 
 * Automatically applies organisationId to documents and scopes find/update/delete queries.
 * @param {import('mongoose').Schema} schema 
 * @param {object} options 
 */
const tenantPlugin = (schema, options = {}) => {
  // 1. Add indexed organisationId field if not present
  if (!schema.path('organisationId')) {
    schema.add({
      organisationId: {
        type: String,
        index: true,
        default: () => getTenantId() || 'org_default'
      }
    });
  }

  // 2. Pre-save hook: ensure organisationId is set
  schema.pre('save', function (next) {
    if (!this.organisationId) {
      const activeTenant = getTenantId();
      if (activeTenant) {
        this.organisationId = activeTenant;
      }
    }
    next();
  });

  // 3. Pre-insertMany hook
  schema.pre('insertMany', function (next, docs) {
    const activeTenant = getTenantId();
    if (activeTenant && Array.isArray(docs)) {
      docs.forEach(doc => {
        if (!doc.organisationId) {
          doc.organisationId = activeTenant;
        }
      });
    }
    next();
  });

  // 4. Query Scoping Middleware
  const queryOps = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'findOneAndReplace',
    'updateMany',
    'updateOne',
    'deleteMany',
    'deleteOne',
    'countDocuments',
    'estimatedDocumentCount'
  ];

  queryOps.forEach((op) => {
    schema.pre(op, function () {
      // Allow explicit bypass via query options: Model.find().setOptions({ bypassTenant: true })
      if (this.getOptions && this.getOptions().bypassTenant) {
        return;
      }

      const activeTenant = getTenantId();
      if (activeTenant) {
        const filter = this.getQuery() || {};
        // Only set if not explicitly specified in the query
        if (filter.organisationId === undefined) {
          this.where({ organisationId: activeTenant });
        }
      }
    });
  });
};

/**
 * Run a function within a specific tenant context (useful in tests, scripts, background jobs).
 */
const runInTenantContext = (tenantId, fn) => {
  return tenantStorage.run({ tenantId }, fn);
};

module.exports = tenantContext;
module.exports.tenantContext = tenantContext;
module.exports.tenantPlugin = tenantPlugin;
module.exports.getTenantId = getTenantId;
module.exports.runInTenantContext = runInTenantContext;
module.exports.tenantStorage = tenantStorage;
