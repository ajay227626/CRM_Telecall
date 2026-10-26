const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const User = require('./models/User');
const Session = require('./models/Session');
const Lead = require('./models/Lead');
const mongoose = require('mongoose');

async function testCluster0() {
    console.log('=== STARTING CLUSTER0 UNIVERSAL DATABASE TEST ===\n');
    
    // 1. Initial Connection
    console.log('[Test 1] Establishing initial Mongoose connection via connectDB()...');
    const conn1 = await connectDB();
    const host = conn1.connection ? conn1.connection.host : mongoose.connection.host;
    const dbName = conn1.connection ? conn1.connection.name : mongoose.connection.name;
    
    console.log(`Connected to host: ${host}`);
    console.log(`Connected to database: ${dbName}`);
    
    if (!host.includes('shcnisx.mongodb.net')) {
        throw new Error(`Expected host to contain shcnisx.mongodb.net, but got: ${host}`);
    }
    if (dbName !== 'crm_production') {
        throw new Error(`Expected database to be crm_production, but got: ${dbName}`);
    }
    console.log('✔ Test 1 Passed: Connected to Cluster0 crm_production!\n');

    // 2. Serverless Connection Cache Test
    console.log('[Test 2] Testing serverless connection reuse (cached.conn)...');
    const conn2 = await connectDB();
    if (conn1 !== conn2) {
        throw new Error('connectDB() returned a different connection instance instead of reusing cached connection!');
    }
    console.log('✔ Test 2 Passed: Connection was reused from memory without re-establishing socket!\n');

    // 3. Schema & Collection Verification
    console.log('[Test 3] Verifying collection accessibility and indices...');
    const testSessionToken = `sess_cluster0_test_${Date.now()}`;
    const testSession = await Session.create({
        sessionToken: testSessionToken,
        userId: new mongoose.Types.ObjectId(),
        email: 'cluster0.tester@ajaywebservices.in',
        role: 'Admin',
        organisationId: 'org_test_cluster0',
        entitlements: ['telecall-crm'],
        slmSub: `sub_${Date.now()}`,
        expiresAt: new Date(Date.now() + 60000)
    });
    console.log(`Created test session in Cluster0: ${testSession._id}`);

    const retrieved = await Session.findOne({ sessionToken: testSessionToken });
    if (!retrieved || retrieved.email !== 'cluster0.tester@ajaywebservices.in') {
        throw new Error('Failed to retrieve test session from Cluster0!');
    }
    console.log('✔ Test 3.1 Passed: Read & write on Cluster0 verified.');

    // Cleanup
    await Session.deleteOne({ _id: testSession._id });
    console.log('✔ Test 3.2 Passed: Cleaned up test document.\n');

    console.log('========================================================');
    console.log('✅ ALL CLUSTER0 UNIVERSAL DATABASE TESTS PASSED!');
    console.log('========================================================');
    process.exit(0);
}

testCluster0().catch((err) => {
    console.error('❌ Cluster0 test failed:', err);
    process.exit(1);
});
