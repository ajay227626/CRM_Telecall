const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:8000/api/auth/google/callback'
},
    async (accessToken, refreshToken, profile, done) => {
        try {
            // Check if user already exists
            let user = await User.findOne({ email: profile.emails[0].value });

            if (user) {
                // User exists, check if Google ID is already linked
                if (user.googleId) {
                    // Already linked, just update avatar if needed
                    user.googleAvatar = profile.photos[0]?.value;
                    if (!user.isCustomAvatar || !user.avatar) {
                        user.avatar = profile.photos[0]?.value;
                    }
                    await user.save();
                    return done(null, user);
                } else {
                    // User exists but NOT linked to Google -> Security Check Required
                    return done(null, false, {
                        type: 'unlinked_account',
                        user: user,
                        provider: 'google',
                        profile: profile
                    });
                }
            }

            // Create new user
            user = await User.create({
                googleId: profile.id,
                name: profile.displayName,
                email: profile.emails[0].value,
                avatar: profile.photos[0]?.value,
                googleAvatar: profile.photos[0]?.value, // Initialize googleAvatar
                isCustomAvatar: false, // Default to using Google avatar
                systemRole: null, // Will be assigned by Admin
                status: 'Active',
                permissions: []
            });

            done(null, user);
        } catch (error) {
            done(error, null);
        }
    }));

// Configure Microsoft Strategy
const MicrosoftStrategy = require('passport-microsoft').Strategy;

if (process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET) {
    passport.use(new MicrosoftStrategy({
        clientID: process.env.MICROSOFT_CLIENT_ID,
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
        callbackURL: 'http://localhost:8000/api/auth/microsoft/callback',
        scope: ['user.read']
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ email: profile.emails[0].value });

                if (user) {
                    // User exists, check if Microsoft ID is already linked
                    if (user.microsoftId) {
                        // Already linked, update details if needed
                        if ((!user.isCustomAvatar || !user.avatar) && !user.avatar) {
                            // Update avatar logic if needed
                        }
                        await user.save();
                        return done(null, user);
                    } else {
                        // User exists but NOT linked -> Security Check Required
                        return done(null, false, {
                            type: 'unlinked_account',
                            user: user,
                            provider: 'microsoft',
                            profile: profile
                        });
                    }
                }

                // Create new user
                user = await User.create({
                    microsoftId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    // Avatar handling might need enhancement for MS Graph, leaving undefined for now
                    isCustomAvatar: false,
                    systemRole: null,
                    status: 'Active',
                    permissions: []
                });

                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }
    ));
}

// Configure Facebook Strategy
const FacebookStrategy = require('passport-facebook').Strategy;

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
    passport.use(new FacebookStrategy({
        clientID: process.env.FACEBOOK_APP_ID,
        clientSecret: process.env.FACEBOOK_APP_SECRET,
        callbackURL: 'http://localhost:8000/api/auth/facebook/callback',
        profileFields: ['id', 'displayName', 'photos', 'email']
    },
        async (accessToken, refreshToken, profile, done) => {
            try {
                // Check if user already exists
                let user = await User.findOne({ email: profile.emails[0].value });

                const fbAvatar = `https://graph.facebook.com/${profile.id}/picture?width=1024`;

                if (user) {
                    // User exists, check if Facebook ID is already linked
                    if (user.facebookId) {
                        // Already linked
                        user.facebookAvatar = fbAvatar;
                        if (!user.isCustomAvatar || !user.avatar) {
                            user.avatar = fbAvatar;
                        }
                        await user.save();
                        return done(null, user);
                    } else {
                        // User exists but NOT linked -> Security Check Required
                        return done(null, false, {
                            type: 'unlinked_account',
                            user: user,
                            provider: 'facebook',
                            profile: profile
                        });
                    }
                }

                // Create new user
                user = await User.create({
                    facebookId: profile.id,
                    name: profile.displayName,
                    email: profile.emails[0].value,
                    avatar: fbAvatar,
                    facebookAvatar: fbAvatar,
                    isCustomAvatar: false,
                    systemRole: 'Guest', // Default to Guest
                    status: 'Active',
                    permissions: []
                });

                done(null, user);
            } catch (error) {
                done(error, null);
            }
        }));
}

// Serialize user for session
passport.serializeUser((user, done) => {
    done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;
