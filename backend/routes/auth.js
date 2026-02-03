const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const passport = require('passport');
const jwt = require('jsonwebtoken');

// Health check endpoint for Gmail OAuth2 configuration
router.get('/gmail-config-check', (req, res) => {
    const config = {
        hasClientId: !!process.env.GMAIL_OAUTH_CLIENT_ID,
        hasClientSecret: !!process.env.GMAIL_OAUTH_CLIENT_SECRET,
        hasRefreshToken: !!process.env.GMAIL_OAUTH_REFRESH_TOKEN,
        hasEmail: !!process.env.GMAIL_APP_EMAIL,
        email: process.env.GMAIL_APP_EMAIL ? process.env.GMAIL_APP_EMAIL.substring(0, 3) + '***' : 'not set'
    };
    
    const allConfigured = config.hasClientId && config.hasClientSecret && config.hasRefreshToken && config.hasEmail;
    
    res.json({
        status: allConfigured ? 'configured' : 'missing_config',
        config,
        message: allConfigured 
            ? 'Gmail OAuth2 appears to be configured' 
            : 'Missing required Gmail OAuth2 environment variables'
    });
});

router.post('/send-otp', authController.sendOTP);
router.post('/verify-otp', authController.verifyOTP);
router.post('/initiate-password-reset', authController.initiatePasswordReset);
router.post('/verify-otp-reset-password', authController.verifyOTPAndResetPassword);
router.post('/login', authController.login); // Add traditional login route

// Google OAuth routes
router.get('/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/google/callback', (req, res, next) => {
    passport.authenticate('google', { failureRedirect: 'https://crm-telecall.vercel.app/login' }, (err, user, info) => {
        if (err) return next(err);

        // Handle Unlinked Account (Security Check)
        if (!user && info && info.type === 'unlinked_account') {
            const pendingToken = jwt.sign(
                {
                    userId: info.user._id,
                    email: info.user.email,
                    provider: info.provider,
                    providerProfile: info.profile,
                    isPendingLink: true
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '15m' }
            );
            return res.redirect(`https://crm-telecall.vercel.app/auth/verify-link?token=${pendingToken}&provider=${info.provider}`);
        }

        if (!user) return res.redirect('https://crm-telecall.vercel.app/login');

        req.logIn(user, (err) => {
            if (err) return next(err);

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    systemRole: user.systemRole,
                    customRole: user.customRole
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            user.lastLogin = new Date();
            user.save();

            const userData = encodeURIComponent(JSON.stringify({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions || [],
                avatarHistory: user.avatarHistory,
                googleAvatar: user.googleAvatar,
                facebookAvatar: user.facebookAvatar,
                microsoftAvatar: user.microsoftAvatar,
                googleId: user.googleId,
                facebookId: user.facebookId,
                microsoftId: user.microsoftId,
                isCustomAvatar: user.isCustomAvatar
            }));

            res.redirect(`https://crm-telecall.vercel.app/auth/callback?token=${token}&user=${userData}`);
        });
    })(req, res, next);
});

// Microsoft OAuth routes
router.get('/microsoft',
    passport.authenticate('microsoft', { prompt: 'select_account' })
);

router.get('/microsoft/callback', (req, res, next) => {
    passport.authenticate('microsoft', { failureRedirect: 'https://crm-telecall.vercel.app/login' }, (err, user, info) => {
        if (err) return next(err);

        // Handle Unlinked Account
        if (!user && info && info.type === 'unlinked_account') {
            const pendingToken = jwt.sign(
                {
                    userId: info.user._id,
                    email: info.user.email,
                    provider: info.provider,
                    providerProfile: info.profile,
                    isPendingLink: true
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '15m' }
            );
            return res.redirect(`https://crm-telecall.vercel.app/auth/verify-link?token=${pendingToken}&provider=${info.provider}`);
        }

        if (!user) return res.redirect('https://crm-telecall.vercel.app/login');

        req.logIn(user, (err) => {
            if (err) return next(err);

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    systemRole: user.systemRole,
                    customRole: user.customRole
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            user.lastLogin = new Date();
            user.save();

            const userData = encodeURIComponent(JSON.stringify({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions || [],
                avatarHistory: user.avatarHistory,
                googleAvatar: user.googleAvatar,
                facebookAvatar: user.facebookAvatar,
                microsoftAvatar: user.microsoftAvatar,
                googleId: user.googleId,
                facebookId: user.facebookId,
                microsoftId: user.microsoftId,
                isCustomAvatar: user.isCustomAvatar
            }));

            res.redirect(`https://crm-telecall.vercel.app/auth/callback?token=${token}&user=${userData}`);
        });
    })(req, res, next);
});

// Avatar upload route
const upload = require('../middleware/uploadMiddleware');
const auth = require('../middleware/auth');

router.post('/upload-avatar',
    auth,
    upload.single('avatar'),
    authController.uploadAvatar
);

router.post('/select-avatar',
    auth,
    authController.selectAvatar
);

// Account Management
router.post('/deactivate', auth, authController.deactivateAccount);
router.post('/request-delete', auth, authController.requestDeleteAccount);
router.post('/confirm-delete', auth, authController.confirmDeleteAccount);

// Linking & Password Management
router.post('/unlink', auth, authController.unlinkProvider);
router.post('/password/set-request', auth, authController.requestSetPasswordOTP);
router.post('/password/set-confirm', auth, authController.verifyAndSetPassword);
router.post('/password/change-init', auth, authController.initiateChangePassword);
router.post('/password/change-confirm', auth, authController.finalizeChangePassword);
router.post('/verify-link', authController.verifyLinkAccount); // New Secure Link Verification Endpoint

// Security Verification Routes
router.post('/security/request-otp', auth, authController.requestSecurityOTP);
router.post('/security/verify', auth, authController.verifySecurityAction);

// Facebook OAuth Routes
router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get('/facebook/callback', (req, res, next) => {
    passport.authenticate('facebook', { failureRedirect: 'https://crm-telecall.vercel.app/login' }, (err, user, info) => {
        if (err) return next(err);

        // Handle Unlinked Account
        if (!user && info && info.type === 'unlinked_account') {
            const pendingToken = jwt.sign(
                {
                    userId: info.user._id,
                    email: info.user.email,
                    provider: info.provider,
                    providerProfile: info.profile,
                    isPendingLink: true
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '15m' }
            );
            return res.redirect(`https://crm-telecall.vercel.app/auth/verify-link?token=${pendingToken}&provider=${info.provider}`);
        }

        if (!user) return res.redirect('https://crm-telecall.vercel.app/login');

        req.logIn(user, (err) => {
            if (err) return next(err);

            const token = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    systemRole: user.systemRole,
                    customRole: user.customRole
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            user.lastLogin = new Date();
            user.save();

            const userData = encodeURIComponent(JSON.stringify({
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions || [],
                avatarHistory: user.avatarHistory,
                googleAvatar: user.googleAvatar,
                facebookAvatar: user.facebookAvatar,
                microsoftAvatar: user.microsoftAvatar,
                googleId: user.googleId,
                facebookId: user.facebookId,
                microsoftId: user.microsoftId,
                isCustomAvatar: user.isCustomAvatar
            }));

            res.redirect(`https://crm-telecall.vercel.app/auth/callback?token=${token}&user=${userData}`);
        });
    })(req, res, next);
});

module.exports = router;
