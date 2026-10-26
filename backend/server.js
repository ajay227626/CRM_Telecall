const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const path = require('path');

// Load environment variables FIRST (resolve relative to backend folder)
dotenv.config({ path: path.resolve(__dirname, '.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration - Allow all origins
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Organisation-Id']
}));
app.use(express.json());
app.use(cookieParser());

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

app.get('/', (req, res) => {
    res.send('Telecall CRM Backend is running');
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start standalone server only when run directly
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
