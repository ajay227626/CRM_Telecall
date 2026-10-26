const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config();

const baseUri = process.env.SLM_MONGODB_URI || process.env.MONGODB_URI;
if (!baseUri) {
    throw new Error('MONGODB_URI or SLM_MONGODB_URI must be set in .env');
}

async function seedSLM() {
    console.log('=== STARTING CENTRAL SLM PRODUCT & OIDC SEEDING ===\n');
    await mongoose.connect(baseUri, { dbName: 'slm_production' });
    const db = mongoose.connection.db;

    // 1. Product Document in `products`
    console.log('[Step 1] Upserting telecall-crm product document in products collection...');
    const productKey = 'telecall-crm';
    const productDoc = {
        workspaceId: 'default',
        name: 'Telecall CRM & Pipeline Velocity',
        key: productKey,
        description: 'Next-generation telecalling CRM with real-time pipeline management, automated call logging, lead aging tracking, AI scoring, and seamless Central SLM single sign-on.',
        repoUrl: 'https://github.com/ajay227626/CRM_Telecall',
        techStack: ['React 19', 'Vite', 'Node.js', 'Express 5', 'MongoDB Atlas', 'TailwindCSS'],
        owner: 'ajay22071997barman@gmail.com',
        environments: {
            development: { url: 'http://localhost:5173' },
            staging: { url: 'https://staging-crm.ajaywebservices.in' },
            production: { url: 'https://crm.ajaywebservices.in' }
        },
        status: 'live',
        maintenance: false,
        ecosystem: {
            enabled: true,
            status: 'live',
            appType: 'saas',
            homeUrl: 'https://crm.ajaywebservices.in',
            launchUrl: 'https://crm.ajaywebservices.in',
            category: 'Business Operations',
            visibility: 'public',
            featured: true,
            sortOrder: 3,
            isFree: true
        },
        commercialModel: 'free',
        provisioningPolicy: {
            autoProvisionOnFirstAccess: true,
            defaultPlanId: 'plan_telecall-crm_starter_free',
            defaultPlanName: 'Starter / Free Tier'
        },
        defaultPlanId: 'plan_telecall-crm_starter_free',
        updatedAt: new Date()
    };

    const productRes = await db.collection('products').findOneAndUpdate(
        { key: productKey },
        { 
            $set: productDoc,
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true, returnDocument: 'after' }
    );
    const productId = productRes?._id || (await db.collection('products').findOne({ key: productKey }))._id;
    console.log(`✔ Product telecall-crm upserted successfully: ${productId}\n`);

    // 2. Commercial Policy in `plans`
    console.log('[Step 2] Upserting default plan in plans collection...');
    const planId = 'plan_telecall-crm_starter_free';
    const planDoc = {
        workspaceId: 'default',
        planId: planId,
        applicableProductKeys: [productKey],
        commercialModel: 'freemium',
        description: 'Starter Tier with ₹0 pricing providing core pipeline management, multi-agent calling, lead logging, and Central SLM authentication.',
        isDefault: true,
        name: 'Starter / Free Tier',
        planKey: 'telecall-crm_starter_free',
        productKey: productKey,
        status: 'active',
        isGeneric: false,
        updatedAt: new Date()
    };

    await db.collection('plans').updateOne(
        { planId: planId },
        {
            $set: planDoc,
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
    );
    console.log(`✔ Plan ${planId} upserted successfully.\n`);

    // 3. Plan Version in `plan_versions`
    console.log('[Step 3] Upserting plan version in plan_versions collection...');
    const planVersionId = 'pv_telecall-crm_starter_free_v1';
    const planVersionDoc = {
        planVersionId: planVersionId,
        planId: planId,
        version: 1,
        currency: 'INR',
        amount: 0,
        currencyPricing: {
            INR: {
                amount: 0,
                interval: 'lifetime'
            }
        },
        billingCycle: 'lifetime',
        entitlements: [
            'telecall-crm',
            'telecall-crm.basic',
            'telecall-crm.leads',
            'telecall-crm.calls',
            'telecall-crm.export'
        ],
        limits: {
            leads: 10000,
            calls: 5000
        },
        limitMergeStrategies: {},
        features: [
            'Unlimited lead tracking',
            'Real-time pipeline kanban',
            'Direct & masked calling',
            'Central SLM SSO authentication'
        ],
        updatedAt: new Date()
    };

    await db.collection('plan_versions').updateOne(
        { planVersionId: planVersionId },
        {
            $set: planVersionDoc,
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
    );
    console.log(`✔ Plan version ${planVersionId} upserted successfully.\n`);

    // 4. OIDC Client in `oauth_clients`
    console.log('[Step 4] Upserting client_telecall_crm in oauth_clients collection...');
    const clientId = 'client_telecall_crm';
    const oauthClientDoc = {
        clientId: clientId,
        clientSecretHash: null,
        isPublic: true,
        productId: productId,
        productKey: productKey,
        name: 'Telecall CRM & Pipeline Velocity',
        redirectUris: [
            'https://crm.ajaywebservices.in/api/auth/oidc/callback',
            'https://crm-telecall.vercel.app/api/auth/oidc/callback',
            'http://localhost:8000/api/auth/oidc/callback',
            'http://localhost:5173/auth/callback'
        ],
        postLogoutRedirectUris: [
            'https://crm.ajaywebservices.in/',
            'https://crm-telecall.vercel.app/',
            'http://localhost:5173/'
        ],
        backchannelLogoutUri: 'https://crm.ajaywebservices.in/api/auth/oidc/backchannel-logout',
        allowedScopes: [
            'openid',
            'profile',
            'email',
            'organisation',
            'workspace',
            'entitlements',
            'offline_access'
        ],
        applicationType: 'spa',
        status: 'active',
        updatedAt: new Date()
    };

    await db.collection('oauth_clients').updateOne(
        { clientId: clientId },
        {
            $set: oauthClientDoc,
            $setOnInsert: { createdAt: new Date() }
        },
        { upsert: true }
    );
    console.log(`✔ OAuth client ${clientId} upserted successfully.\n`);

    console.log('========================================================');
    console.log('✅ ALL CENTRAL SLM RECORDS SUCCESSFULLY SEEDED & PUBLISHED!');
    console.log('========================================================');
    await mongoose.disconnect();
}

seedSLM().catch((err) => {
    console.error('❌ Error during SLM seeding:', err);
    process.exit(1);
});
