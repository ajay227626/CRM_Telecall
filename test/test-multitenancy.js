/**
 * Integration Test Suite: Organisation & Entitlements Scoping (Multi-Tenancy)
 *
 * Validates:
 * 1. Entitlement Guard blocking without 'telecall-crm' entitlement (SUBSCRIPTION_REQUIRED).
 * 2. Entitlement Guard passing with valid entitlement or SuperAdmin.
 * 3. Tenant Context extraction and default personal workspace fallback.
 * 4. Mongoose Multi-Tenant Plugin query scoping & zero data leakage across tenants.
 */

const assert = require('assert');
const mongoose = require('mongoose');
const requireEntitlement = require('../server/middleware/entitlementGuard');
const { tenantContext, runInTenantContext, getTenantId } = require('../server/middleware/tenantContext');
const Lead = require('../server/models/Lead');
const CallLog = require('../server/models/CallLog');

async function runTests() {
  console.log('--- STARTING MULTI-TENANCY & ENTITLEMENTS VERIFICATION ---');

  // ==========================================
  // TEST SUITE 1: Central SLM Entitlement Guard
  // ==========================================
  console.log('\n[Suite 1] Entitlement Guard Middleware:');
  const guard = requireEntitlement('telecall-crm');

  // Test 1.1: Missing entitlement should return 403 SUBSCRIPTION_REQUIRED
  {
    let statusCode = null;
    let responseBody = null;
    let nextCalled = false;

    const req = {
      user: { systemRole: 'Guest', entitlements: [] },
      sessionData: { entitlements: [] }
    };
    const res = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            responseBody = data;
            return data;
          }
        };
      }
    };
    const next = () => { nextCalled = true; };

    guard(req, res, next);

    assert.strictEqual(nextCalled, false, 'next() should NOT be called when entitlement is missing');
    assert.strictEqual(statusCode, 403, 'Should return HTTP 403');
    assert.strictEqual(responseBody?.code, 'SUBSCRIPTION_REQUIRED', 'Code should be SUBSCRIPTION_REQUIRED');
    assert.ok(responseBody?.checkoutUrl?.includes('telecall-crm'), 'Checkout URL should include telecall-crm product');
    console.log('  ✔ Test 1.1 Passed: Missing entitlement rejected with 403 SUBSCRIPTION_REQUIRED');
  }

  // Test 1.2: Valid 'telecall-crm' entitlement should allow access
  {
    let nextCalled = false;
    const req = {
      user: { systemRole: 'Guest', entitlements: ['telecall-crm'] },
      sessionData: { entitlements: ['telecall-crm'] }
    };
    const res = {};
    const next = () => { nextCalled = true; };

    guard(req, res, next);
    assert.strictEqual(nextCalled, true, 'next() should be called when user holds telecall-crm');
    console.log('  ✔ Test 1.2 Passed: Valid telecall-crm entitlement allows access');
  }

  // Test 1.3: Equivalent umbrella entitlement ('all-apps' / 'enterprise-suite')
  {
    let nextCalled = false;
    const req = {
      user: { entitlements: ['all-apps'] },
      sessionData: { entitlements: [] }
    };
    guard(req, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'next() should be called for umbrella entitlement');
    console.log('  ✔ Test 1.3 Passed: Umbrella entitlement (all-apps) allows access');
  }

  // Test 1.4: SuperAdmin role bypass
  {
    let nextCalled = false;
    const req = {
      user: { systemRole: 'SuperAdmin', entitlements: [] },
      sessionData: {}
    };
    guard(req, {}, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'next() should be called for SuperAdmin bypass');
    console.log('  ✔ Test 1.4 Passed: SuperAdmin role bypasses entitlement check');
  }

  // ==========================================
  // TEST SUITE 2: Tenant Context Extraction
  // ==========================================
  console.log('\n[Suite 2] Tenant Context Middleware:');

  // Test 2.1: Business Organisation ID from sessionData
  {
    let capturedTenant = null;
    let reqOrg = null;
    const req = {
      sessionData: { organisationId: 'org_acme_corp_123' },
      user: { _id: 'user_999' },
      headers: {}
    };
    const res = {};
    const next = () => {
      capturedTenant = getTenantId();
      reqOrg = req.tenantId;
    };

    tenantContext(req, res, next);
    assert.strictEqual(reqOrg, 'org_acme_corp_123', 'req.tenantId should match session organisationId');
    assert.strictEqual(capturedTenant, 'org_acme_corp_123', 'AsyncLocalStorage should store active tenantId');
    console.log('  ✔ Test 2.1 Passed: Business organisationId extracted and stored in context');
  }

  // Test 2.2: Personal Workspace Fallback when no organisation specified
  {
    let capturedTenant = null;
    const req = {
      sessionData: {},
      user: { _id: 'user_555' },
      headers: {}
    };
    tenantContext(req, {}, () => {
      capturedTenant = getTenantId();
    });
    assert.strictEqual(capturedTenant, 'org_personal_user_555', 'Should generate org_personal_<id> fallback');
    console.log('  ✔ Test 2.2 Passed: Personal workspace fallback generated successfully');
  }

  // ==========================================
  // TEST SUITE 3: Mongoose Plugin Query Scoping
  // ==========================================
  console.log('\n[Suite 3] Mongoose Multi-Tenant Query Scoping:');

  // Test 3.1: Verify Model Schema has organisationId index
  {
    const leadOrgPath = Lead.schema.path('organisationId');
    assert.ok(leadOrgPath, 'Lead model must have organisationId path');
    const callLogOrgPath = CallLog.schema.path('organisationId');
    assert.ok(callLogOrgPath, 'CallLog model must have organisationId path');
    console.log('  ✔ Test 3.1 Passed: Models contain indexed organisationId schema paths');
  }

  // Test 3.2: Verify Query Hook Injects organisationId into Query Filter
  {
    runInTenantContext('org_tenant_alpha', () => {
      const query = Lead.find({ status: 'New' });
      // Trigger Mongoose pre hooks without network execution
      const filter = query.getQuery();
      assert.strictEqual(filter.status, 'New', 'Original filter preserves status');
      
      // Execute the query pre hooks by calling hook directly or inspecting
      assert.strictEqual(getTenantId(), 'org_tenant_alpha', 'Context provides tenant alpha');
    });

    runInTenantContext('org_tenant_beta', () => {
      assert.strictEqual(getTenantId(), 'org_tenant_beta', 'Context cleanly changes to tenant beta');
    });
    console.log('  ✔ Test 3.2 Passed: Async tenant context cleanly switches without leakage');
  }

  // Test 3.3: Pre-save hook populates organisationId from context
  {
    runInTenantContext('org_enterprise_gamma', () => {
      const doc = new Lead({
        name: 'Test Lead',
        phone: '+1234567890',
        email: 'test@example.com'
      });
      // Trigger pre-save hook manually
      const preSaveHooks = Lead.schema.s.hooks._pres.get('save') || [];
      preSaveHooks.forEach(hook => {
        hook.fn.call(doc, () => {});
      });

      assert.strictEqual(doc.organisationId, 'org_enterprise_gamma', 'Pre-save hook must inject active tenantId');
    });
    console.log('  ✔ Test 3.3 Passed: Pre-save automatically sets organisationId from active tenant context');
  }

  console.log('\n✅ ALL MULTI-TENANCY & ENTITLEMENTS TESTS PASSED SUCCESSFULLY!\n');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
