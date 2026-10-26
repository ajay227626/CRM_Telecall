const mongoose = require('mongoose');

let cached = global.mongoose || { conn: null, promise: null };

async function connectDB() {
    if (cached.conn && mongoose.connection.readyState === 1) {
        return cached.conn;
    }

    if (!cached.promise) {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/crm_production';
        const dbName = process.env.MONGODB_DB_NAME || 'crm_production';

        const opts = {
            bufferCommands: false,
            maxPoolSize: process.env.MONGODB_MAX_POOL_SIZE ? parseInt(process.env.MONGODB_MAX_POOL_SIZE, 10) : 10,
            minPoolSize: 1,
            serverSelectionTimeoutMS: 8000,
            socketTimeoutMS: 45000,
            dbName: dbName,
            autoIndex: process.env.NODE_ENV !== 'production'
        };

        cached.promise = mongoose.connect(mongoUri, opts).then((m) => {
            const host = m.connection.host || 'cluster0.shcnisx.mongodb.net';
            const connectedDb = m.connection.name || dbName;
            console.log(`[DB] Connected successfully to database [${connectedDb}] on [${host}] (cached connection)`);
            return m;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (err) {
        cached.promise = null;
        console.error('[DB] Connection failure:', err.message);
        throw err;
    }

    global.mongoose = cached;
    return cached.conn;
}

module.exports = { connectDB };

