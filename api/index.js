const app = require('../backend/server.js');
const { connectDB } = require('../backend/config/db.js');

module.exports = async (req, res) => {
    try {
        await connectDB();
    } catch (err) {
        console.error('Database connection error in serverless entrypoint:', err.message);
    }
    // Ensure req.url starts with /api for Express router if Vercel stripped it
    if (!req.url.startsWith('/api')) {
        req.url = '/api' + (req.url.startsWith('/') ? req.url : '/' + req.url);
    }
    return app(req, res);
};
