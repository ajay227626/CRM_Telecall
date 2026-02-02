const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const cookieParser = require('cookie-parser');

// Load environment variables FIRST
dotenv.config();

// Now require passport (which needs env vars)
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 8000;

// CORS Configuration - Allow all origins
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json());
app.use(cookieParser());
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true in production with HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Database Connection
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/telecall_crm';
mongoose.connect(mongoUri)
    .then(() => console.log('MongoDB Connected to:', mongoUri))
    .catch(err => console.log('MongoDB Connection Error:', err));

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

app.get('/', (req, res) => {
    res.send('Telecall CRM Backend is running');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
