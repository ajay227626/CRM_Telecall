const User = require('../models/User');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { google } = require('googleapis');

// Gmail OAuth2 Configuration
const OAuth2 = google.auth.OAuth2;

// Create OAuth2 client for Gmail
const createOAuth2Client = () => {
    return new OAuth2(
        process.env.GMAIL_OAUTH_CLIENT_ID,
        process.env.GMAIL_OAUTH_CLIENT_SECRET,
        'https://developers.google.com/oauthplayground' // Redirect URL
    );
};

// Create transporter with OAuth2
const createTransporter = async () => {
    // Check if OAuth2 credentials are available
    if (!process.env.GMAIL_OAUTH_CLIENT_ID || !process.env.GMAIL_OAUTH_CLIENT_SECRET || !process.env.GMAIL_OAUTH_REFRESH_TOKEN) {
        console.error('Gmail OAuth2 credentials missing. Required: GMAIL_OAUTH_CLIENT_ID, GMAIL_OAUTH_CLIENT_SECRET, GMAIL_OAUTH_REFRESH_TOKEN');
        console.log('Available env vars:', {
            hasClientId: !!process.env.GMAIL_OAUTH_CLIENT_ID,
            hasClientSecret: !!process.env.GMAIL_OAUTH_CLIENT_SECRET,
            hasRefreshToken: !!process.env.GMAIL_OAUTH_REFRESH_TOKEN,
            hasEmail: !!process.env.GMAIL_APP_EMAIL
        });
        throw new Error('Gmail OAuth2 credentials not configured');
    }

    try {
        const oauth2Client = createOAuth2Client();
        oauth2Client.setCredentials({
            refresh_token: process.env.GMAIL_OAUTH_REFRESH_TOKEN
        });

        console.log('Getting access token...');
        const accessToken = await oauth2Client.getAccessToken();
        console.log('Access token obtained successfully');

        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user: process.env.GMAIL_APP_EMAIL,
                clientId: process.env.GMAIL_OAUTH_CLIENT_ID,
                clientSecret: process.env.GMAIL_OAUTH_CLIENT_SECRET,
                refreshToken: process.env.GMAIL_OAUTH_REFRESH_TOKEN,
                accessToken: accessToken.token
            }
        });
    } catch (error) {
        console.error('Error creating email transporter:', error.message);
        throw error;
    }
};

// Helper function to send email
const sendEmail = async (mailOptions) => {
    console.log('Attempting to send email to:', mailOptions.to);
    const transporter = await createTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
};

exports.sendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Check if user exists, if not create a new one (or specific behavior for first-time login)
        let user = await User.findOne({ email });

        // Auto-handle SuperAdmin
        if (email === 'ajay22071997barman@gmail.com') {
            if (!user) {
                user = new User({
                    name: 'Ajay Barman',
                    email: email,
                    systemRole: 'SuperAdmin',
                    status: 'Active',
                    permissions: ['ALL']
                });
            } else {
                // Ensure Super Admin privileges and Name
                user.systemRole = 'SuperAdmin';
                user.permissions = ['ALL'];
                if (user.name === 'Super Admin') user.name = 'Ajay Barman';
            }
        }

        if (!user) {
            // For now, allow new users to sign up via OTP? 
            // Better to restrict to existing users unless it's the first admin.
            // Let's allow but set as Telecaller by default if not superadmin.
            user = new User({
                name: email.split('@')[0],
                email: email,
                systemRole: null,
                customRole: null,
                status: 'Active'
            });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = {
            code: otpCode,
            expiresAt: otpExpires
        };

        await user.save();

        // Send Email
        const mailOptions = {
            from: `"CRM Pro" <${process.env.GMAIL_APP_EMAIL}>`,
            to: email,
            subject: 'Your Login OTP for CRM Pro',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563EB;">Access your Dashboard</h2>
                    <p>Use the following 6-digit code to log in to your CRM Pro account. This code will expire in 10 minutes.</p>
                    <div style="font-size: 32px; font-weight: bold; background: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #1F2937;">
                        ${otpCode}
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await sendEmail(mailOptions);

        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        console.error('OTP Send Error:', err);
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

exports.verifyOTP = async (req, res) => {
    try {
        const { email, code } = req.body;
        if (!email || !code) return res.status(400).json({ error: 'Email and Code are required' });

        const user = await User.findOne({ email });
        if (!user || !user.otp || user.otp.code !== code) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Clear OTP and set last login
        user.otp = { code: null, expiresAt: null };
        user.lastLogin = new Date();
        await user.save();

        // Generate JWT token with user info
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                systemRole: user.systemRole,
                customRole: user.customRole,
                permissions: user.permissions
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions,
                avatar: user.avatar,
                avatarHistory: user.avatarHistory,
                googleId: user.googleId,
                facebookId: user.facebookId,
                microsoftId: user.microsoftId,
                googleAvatar: user.googleAvatar,
                facebookAvatar: user.facebookAvatar,
                microsoftAvatar: user.microsoftAvatar,
                isCustomAvatar: user.isCustomAvatar,
                hasPassword: !!user.password
            }
        });
    } catch (err) {
        console.error('OTP Verify Error:', err);
        res.status(500).json({ error: 'Verification failed' });
    }
};

// New function to initiate password reset (send OTP)
exports.initiatePasswordReset = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        // Find the user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'No user found with this email' });
        }

        // Generate OTP for password reset
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins for password reset

        user.otp = {
            code: otpCode,
            expiresAt: otpExpires
        };

        await user.save();

        // Send Email
        const mailOptions = {
            from: `"CRM Pro" <${process.env.GMAIL_APP_EMAIL}>`,
            to: email,
            subject: 'Password Reset OTP - CRM Pro',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563EB;">Password Reset Request</h2>
                    <p>You have requested to reset your password. Use the following 6-digit code to reset your password. This code will expire in 15 minutes.</p>
                    <div style="font-size: 32px; font-weight: bold; background: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #1F2937;">
                        ${otpCode}
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await sendEmail(mailOptions);

        res.json({ message: 'Password reset OTP sent successfully' });
    } catch (err) {
        console.error('Password Reset Initiate Error:', err);
        res.status(500).json({ error: 'Failed to send password reset OTP' });
    }
};

// New function to verify OTP and reset password
exports.verifyOTPAndResetPassword = async (req, res) => {
    try {
        const { email, code, newPassword } = req.body;
        if (!email || !code || !newPassword) {
            return res.status(400).json({ error: 'Email, Code, and New Password are required' });
        }

        // Validate password strength if needed
        if (newPassword.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters long' });
        }

        // Find the user
        const user = await User.findOne({ email });
        if (!user || !user.otp || user.otp.code !== code) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'OTP has expired' });
        }

        // Hash the new password using bcrypt
        user.password = await bcrypt.hash(newPassword, 10);

        // Clear OTP
        user.otp = { code: null, expiresAt: null };

        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (err) {
        console.error('Password Reset Error:', err);
        res.status(500).json({ error: 'Password reset failed' });
    }
};

// New function for traditional email/password login
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email and Password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // If user has no password set, they can't login with password (must use OTP)
        if (!user.password) {
            return res.status(400).json({ error: 'Password not set. Please use OTP login.' });
        }

        // Compare password with bcrypt
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token with user info
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                systemRole: user.systemRole,
                customRole: user.customRole,
                permissions: user.permissions
            },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '24h' } // Token expires in 24 hours
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions,
                avatar: user.avatar,
                avatarHistory: user.avatarHistory,
                googleId: user.googleId,
                facebookId: user.facebookId,
                microsoftId: user.microsoftId,
                googleAvatar: user.googleAvatar,
                facebookAvatar: user.facebookAvatar,
                microsoftAvatar: user.microsoftAvatar,
                isCustomAvatar: user.isCustomAvatar,
                hasPassword: !!user.password
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
};

// Upload avatar to Cloudinary
// Upload avatar to Cloudinary
exports.uploadAvatar = async (req, res) => {
    try {
        // File is already uploaded to Cloudinary by multer middleware
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const avatarUrl = req.file.path; // Cloudinary URL
        const userId = req.user._id;

        // Fetch user to manage history
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Manage history: add new URL to beginning
        let history = user.avatarHistory || [];
        history.unshift(avatarUrl);

        // Limit history to 4 items
        if (history.length > 4) {
            history = history.slice(0, 4);
        }

        // Update user
        user.avatar = avatarUrl;
        user.avatarHistory = history;
        user.isCustomAvatar = true;

        await user.save();

        res.json({
            success: true,
            message: 'Avatar uploaded successfully',
            avatar: user.avatar,
            avatarHistory: user.avatarHistory,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                avatarHistory: user.avatarHistory,
                googleAvatar: user.googleAvatar,
                isCustomAvatar: user.isCustomAvatar,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Avatar Upload Error:', error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};

exports.selectAvatar = async (req, res) => {
    try {
        const { avatarUrl } = req.body;
        if (!avatarUrl) {
            return res.status(400).json({ error: 'Avatar URL is required' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update avatar
        user.avatar = avatarUrl;

        // Check if selected avatar is the Google one
        if (user.googleAvatar && avatarUrl === user.googleAvatar) {
            user.isCustomAvatar = false;
        } else {
            user.isCustomAvatar = true;
        }

        await user.save();

        res.json({
            success: true,
            message: 'Avatar selected successfully',
            avatar: user.avatar,
            isCustomAvatar: user.isCustomAvatar,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                avatarHistory: user.avatarHistory,
                googleAvatar: user.googleAvatar,
                isCustomAvatar: user.isCustomAvatar,
                systemRole: user.systemRole,
                customRole: user.customRole,
                role: user.systemRole || 'User',
                permissions: user.permissions
            }
        });
    } catch (error) {
        console.error('Select Avatar Error:', error);
        res.status(500).json({ error: 'Failed to select avatar' });
    }
};
exports.deactivateAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.status = 'Inactive';
        await user.save();

        res.status(200).json({ message: 'Account deactivated successfully' });
    } catch (error) {
        console.error('Deactivate account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Request Account Deletion (Send OTP)
exports.requestDeleteAccount = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        user.otp = {
            code: otpCode,
            expiresAt: otpExpires
        };
        await user.save();

        // Send OTP via Email
        const mailOptions = {
            from: `"CRM Pro" <${process.env.GMAIL_APP_EMAIL}>`,
            to: user.email,
            subject: 'Account Deletion Verification Code', // Fixed Subject
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #DC2626;">Account Deletion Request</h2>
                    <p>You have requested to permanently delete your account. Use the following code to confirm this action. THIS ACTION CANNOT BE UNDONE.</p>
                    <div style="font-size: 32px; font-weight: bold; background: #FEF2F2; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #991B1B;">
                        ${otpCode}
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">If you did not request this, please change your password immediately.</p>
                </div>
            `
        };

        await sendEmail(mailOptions);

        res.status(200).json({ message: 'Verification code sent to email' });
    } catch (error) {
        console.error('Request delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// Confirm Account Deletion
exports.confirmDeleteAccount = async (req, res) => {
    try {
        const { otp, confirmationString } = req.body;

        if (confirmationString !== 'i_want_delete_my_account') {
            return res.status(400).json({ error: 'Invalid confirmation text' });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify OTP
        if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
            return res.status(400).json({ error: 'No verification code requested' });
        }

        if (user.otp.code !== otp) {
            return res.status(400).json({ error: 'Invalid verification code' });
        }

        if (new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'Verification code expired' });
        }

        // Delete User
        await User.findByIdAndDelete(req.user._id);

        res.status(200).json({ message: 'Account permanently deleted' });
    } catch (error) {
        console.error('Confirm delete account error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// --- Account Linking & Password Management ---

// Link a provider (Google/Microsoft/Facebook) to current account
// Note: The actual linking logic usually happens in the callback of the OAuth flow.
// However, for manual linking (if we send ID token from frontend), we could do it here.
// For this implementation, we will use a dedicated route that initiates the OAuth flow
// with a 'state' parameter indicating it's a LINKING action, not a LOGIN action.
// But for simplicity in this MVP, we will assume the frontend handles the OAuth popup
// and sends the profile data to a 'link-provider' endpoint. 
// ACTUALLY, sticking to standard OAuth:
// We will create specific routes like /auth/google/link, /auth/facebook/link using Passport
// which effectively do the same as login but in the callback, if user is logged in, we link.

// Let's implement the generic logic that will be called by the Passport callbacks
// or a manual 'link' endpoint if we were doing client-side auth.

// 1. Set Password (for social-only users) -> Request OTP
exports.requestSetPasswordOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.password) {
            return res.status(400).json({ error: 'Password already set. Use Change Password.' });
        }

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = { code: otpCode, expiresAt: otpExpires };
        await user.save();

        // Send Email
        const mailOptions = {
            from: `\"CRM Pro\" <${process.env.GMAIL_APP_EMAIL}>`,
            to: user.email,
            subject: 'Set Password Verification Code',
            html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #2563EB;">Set Your Password</h2>
                        <p>You requested to set a password for your account. Use this code to verify it's you.</p>
                        <div style="font-size: 32px; font-weight: bold; background: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; color: #1F2937;">
                            ${otpCode}
                        </div>
                    </div>
                `
        };
        await sendEmail(mailOptions);
        res.json({ message: 'Verification code sent to email' });

    } catch (error) {
        console.error('Request Set Password OTP Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// 2. Verify OTP and Set Password
exports.verifyAndSetPassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        if (!otp || !newPassword) return res.status(400).json({ error: 'OTP and Password required' });
        if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be 8+ chars' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        if (user.password) return res.status(400).json({ error: 'Password already set' });

        if (!user.otp || !user.otp.code || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = { code: null, expiresAt: null };
        await user.save();

        res.json({ message: 'Password set successfully' });

    } catch (error) {
        console.error('Set Password Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// 3. Change Password -> Standard Flow (Current, New) + OTP Step-up
// For this flow: 
// Step 1: User enters Current & New Password. Backend validates Current.
// If valid, Backend generates OTP and sends it.
// Step 2: User enters OTP. Backend verifies and updates Password.

exports.initiateChangePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) return res.status(400).json({ error: 'All fields required' });

        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (!user.password) return res.status(400).json({ error: 'No password set. Use Set Password.' });

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });

        if (newPassword.length < 8) return res.status(400).json({ error: 'New password too short' });

        // Generate OTP for this specific action
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        // We can store a temporary "pending password" in memory or DB, 
        // OR just verify OTP and take newPassword again in step 2.
        // Safer to take newPassword again in Step 2 to avoid storing it, 
        // BUT UI needs to know to keep it or ask again.
        // Standard: Just verify OTP in step 2, pass New Password again.

        user.otp = { code: otpCode, expiresAt: new Date(Date.now() + 10 * 60 * 1000) };
        await user.save();

        // Send Email
        const mailOptions = {
            from: `\"CRM Pro\" <${process.env.GMAIL_APP_EMAIL}>`,
            to: user.email,
            subject: 'Change Password Verification',
            html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px;">
                        <h2>Verify Password Change</h2>
                        <p>Standard security check. Enter this code to confirm password change:</p>
                        <h1 style="background:#eee;padding:10px;text-align:center">${otpCode}</h1>
                    </div>
                `
        };
        await sendEmail(mailOptions);
        res.json({ message: 'Current password verified. OTP sent.' });

    } catch (error) {
        console.error('Init Change Password Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

exports.finalizeChangePassword = async (req, res) => {
    try {
        const { otp, newPassword } = req.body; // Client sends newPassword again
        const user = await User.findById(req.user._id);

        if (!user.otp || user.otp.code !== otp || new Date() > user.otp.expiresAt) {
            return res.status(400).json({ error: 'Invalid or expired OTP' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        user.otp = { code: null, expiresAt: null };
        await user.save();

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Finalize Change Password Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// 4. Unlink Provider
exports.unlinkProvider = async (req, res) => {
    try {
        const { provider } = req.body; // 'google', 'microsoft', 'facebook'
        const user = await User.findById(req.user._id);

        // Safety check: User must have at least one other login method
        // Methods: Password, Google, Microsoft, Facebook
        let methods = 0;
        if (user.password) methods++;
        if (user.googleId) methods++;
        if (user.microsoftId) methods++;
        if (user.facebookId) methods++;

        if (methods <= 1) {
            return res.status(400).json({ error: 'Cannot unlink. You must have at least one login method.' });
        }

        if (provider === 'google') {
            user.googleId = undefined;
            user.googleAvatar = undefined;
            if (!user.isCustomAvatar && user.avatar === user.googleAvatar) user.avatar = null; // Reset avatar if using linked one
        } else if (provider === 'microsoft') {
            user.microsoftId = undefined;
            user.microsoftAvatar = undefined;
        } else if (provider === 'facebook') {
            user.facebookId = undefined;
            user.facebookAvatar = undefined;
        } else {
            return res.status(400).json({ error: 'Invalid provider' });
        }

        await user.save();
        res.json({ message: `${provider} account unlinked successfully` });

    } catch (error) {
        console.error('Unlink Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// 5. Verify Link Account (Secure Linking)
exports.verifyLinkAccount = async (req, res) => {
    try {
        const { token, password, otp } = req.body;

        if (!token) return res.status(400).json({ error: 'Verification token missing' });

        // Verify Pending Token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-jwt-secret');
        } catch (e) {
            return res.status(400).json({ error: 'Invalid or expired verification token' });
        }

        if (!decoded.isPendingLink) {
            return res.status(400).json({ error: 'Invalid token type' });
        }

        const user = await User.findById(decoded.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        let verified = false;

        // Option A: Verify Password
        if (password) {
            if (!user.password) {
                return res.status(400).json({ error: 'This account has no password set. Use OTP.' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect password' });
            }
            verified = true;
        }
        // Option B: Verify OTP
        else if (otp) {
            if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
                return res.status(400).json({ error: 'No OTP requested' });
            }
            if (user.otp.code !== otp) {
                return res.status(400).json({ error: 'Invalid OTP' });
            }
            if (new Date() > user.otp.expiresAt) {
                return res.status(400).json({ error: 'OTP expired' });
            }
            // Clear OTP
            user.otp = undefined;
            verified = true;
        } else {
            return res.status(400).json({ error: 'Password or OTP required' });
        }

        if (verified) {
            // Link the account
            const provider = decoded.provider;
            const profile = decoded.providerProfile;

            if (provider === 'google') {
                user.googleId = profile.id;
                if (!user.isCustomAvatar || !user.avatar) user.googleAvatar = profile.photos[0]?.value;
            } else if (provider === 'facebook') {
                user.facebookId = profile.id;
                const fbAvatar = `https://graph.facebook.com/${profile.id}/picture?width=1024`;
                user.facebookAvatar = fbAvatar;
                if (!user.isCustomAvatar || !user.avatar) user.facebookAvatar = fbAvatar;
            } else if (provider === 'microsoft') {
                user.microsoftId = profile.id;
            }

            // Auto-update active avatar if empty
            if (!user.avatar && (user.googleAvatar || user.facebookAvatar)) {
                user.avatar = user.googleAvatar || user.facebookAvatar;
            }

            await user.save();

            // Generate Login Token
            const loginToken = jwt.sign(
                {
                    userId: user._id,
                    email: user.email,
                    systemRole: user.systemRole,
                    customRole: user.customRole
                },
                process.env.JWT_SECRET || 'your-jwt-secret',
                { expiresIn: '7d' }
            );

            // Return user data for frontend
            const userData = {
                id: user._id,
                name: user.name,
                email: user.email,
                avatar: user.avatar,
                role: user.systemRole || 'User',
                permissions: user.permissions || [],
                googleId: user.googleId,
                facebookId: user.facebookId,
                microsoftId: user.microsoftId,
                googleAvatar: user.googleAvatar,
                facebookAvatar: user.facebookAvatar,
                microsoftAvatar: user.microsoftAvatar,
                isCustomAvatar: user.isCustomAvatar
            };

            res.json({ token: loginToken, user: userData });
        }

    } catch (err) {
        console.error('Verify Link Error:', err);
        res.status(500).json({ error: err.message });
    }
};

// 6. Request Security OTP (for sensitive actions like unlink, deactivate)
exports.requestSecurityOTP = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Generate OTP
        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        user.otp = { code: otpCode, expiresAt: otpExpires };
        await user.save();

        // Send Email
        const mailOptions = {
            from: `"CRM Pro" <${process.env.GMAIL_APP_EMAIL}>`,
            to: user.email,
            subject: 'Security Verification Code',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563EB;">Security Verification</h2>
                    <p>You are performing a sensitive action on your account. Use this code to verify your identity.</p>
                    <div style="font-size: 32px; font-weight: bold; background: #F3F4F6; padding: 15px; text-align: center; border-radius: 8px; letter-spacing: 5px; color: #1F2937;">
                        ${otpCode}
                    </div>
                    <p style="margin-top: 20px; font-size: 14px; color: #6B7280;">This code expires in 10 minutes. If you didn't request this, please secure your account immediately.</p>
                </div>
            `
        };

        await sendEmail(mailOptions);
        res.json({ message: 'Verification code sent to email' });

    } catch (error) {
        console.error('Request Security OTP Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

// 7. Verify Security Action (password or OTP)
exports.verifySecurityAction = async (req, res) => {
    try {
        const { password, otp } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        // Verify with Password
        if (password) {
            if (!user.password) {
                return res.status(400).json({ error: 'No password set on this account' });
            }
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ error: 'Incorrect password' });
            }
            return res.json({ verified: true, message: 'Password verified' });
        }

        // Verify with OTP
        if (otp) {
            if (!user.otp || !user.otp.code || !user.otp.expiresAt) {
                return res.status(400).json({ error: 'No verification code requested' });
            }
            if (user.otp.code !== otp) {
                return res.status(400).json({ error: 'Invalid verification code' });
            }
            if (new Date() > user.otp.expiresAt) {
                return res.status(400).json({ error: 'Verification code expired' });
            }
            // Clear OTP after successful verification
            user.otp = undefined;
            await user.save();
            return res.json({ verified: true, message: 'OTP verified' });
        }

        return res.status(400).json({ error: 'Password or OTP required' });

    } catch (error) {
        console.error('Verify Security Action Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};
