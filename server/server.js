const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const path = require('path');

// Load environment variables FIRST (check root .env, then backend .env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const { connectDB } = require('./config/db');

// Routes
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/users');
const leadsRoutes = require('./routes/leads');
const callLogsRoutes = require('./routes/callLogs');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const rolesRouter = require('./routes/roles');
const settingsTemplatesRoutes = require('./routes/settingsTemplates');
const notificationRoutes = require('./routes/notifications');
const metaRoutes = require('./routes/meta');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Organisation-Id']
}));
app.use(express.json());
app.use(cookieParser());

// ---------------------------------------------------------------
// Global DB middleware — ensures MongoDB is connected before any route handler runs. Critical for Vercel serverless cold starts where require.main !== module (connectDB is never called below).
// ---------------------------------------------------------------
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('[DB Middleware] Connection error:', err.message);
        res.status(503).json({ error: 'Database unavailable. Please try again.' });
    }
});

// Health check (skip DB wait — it's light and already connected by middleware above)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
    res.send('Telecall CRM Backend is running');
});

// API Routes
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/call-logs', callLogsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRouter);
app.use('/api/settings-templates', settingsTemplatesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/activities', require('./routes/activities'));
app.use('/api/meta', metaRoutes);
app.use('/api/ecosystem', require('./routes/ecosystem'));
app.use('/api/ai', require('./routes/ai'));

// Start standalone server only when run directly (local dev)
if (require.main === module) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Server running on port ${PORT}`);
            });
        })
        .catch((err) => {
            console.error('Initial MongoDB connection error:', err);
        });
}

module.exports = app;
