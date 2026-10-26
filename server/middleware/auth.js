const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Session = require('../models/Session');
const tenantContext = require('./tenantContext');
const { connectDB } = require('../config/db');

const auth = async (req, res, next) => {
    try {
        // Ensure DB connection on Vercel serverless cold starts
        await connectDB();
        // Get token from HttpOnly cookie or Authorization header
        const token = req.cookies?.crm_session || req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No session or token, authorization denied' });
        }

        // 1. Try server-managed session lookup
        try {
            const session = await Session.findOne({ sessionToken: token });
            if (session && new Date() < new Date(session.expiresAt)) {
                const user = await User.findById(session.userId).select('-password');
                if (user) {
                    req.user = user;
                    req.sessionData = session;
                    return tenantContext(req, res, next);
                }
            }
        } catch (dbErr) {
            console.warn('Session DB lookup warning:', dbErr.message);
        }

        // 2. Fallback to JWT verification (legacy API tokens / bearer auth)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crm_telecaller_session_secret_key_2024_secure_random_string');
            const user = await User.findById(decoded.userId).select('-password');
            if (user) {
                req.user = user;
                return tenantContext(req, res, next);
            }
        } catch (jwtErr) {
            // Both session and JWT failed
        }

        return res.status(401).json({ error: 'Session or token is not valid' });
    } catch (err) {
        return res.status(401).json({ error: 'Authentication failed' });
    }
};

module.exports = auth;