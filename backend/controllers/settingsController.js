const Settings = require('../models/Settings');

// Get global settings (SuperAdmin level)
exports.getSettings = async (req, res) => {
    try {
        const { category } = req.params;

        // Allow public access to 'system' settings (appearance settings)
        const publicCategories = ['system'];
        if (!publicCategories.includes(category) && !req.user) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        // Get global settings (user: null)
        let settings = await Settings.findOne({ category, user: null });
        if (!settings) {
            return res.json({});
        }
        res.json(settings.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get effective settings (merged: global + user overrides)
exports.getEffectiveSettings = async (req, res) => {
    try {
        const { category, userId } = req.params;
        const mongoose = require('mongoose');

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        console.log('[getEffectiveSettings] Called:', { category, userId, hasUser: !!req.user });

        if (!req.user) {
            console.log('[getEffectiveSettings] No auth - returning 401');
            return res.status(401).json({ error: 'Authorization required' });
        }

        // Get global settings (SuperAdmin level)
        const globalSettings = await Settings.findOne({ category, user: null });
        console.log('[getEffectiveSettings] Global settings found:', !!globalSettings);

        // Get user-specific settings (Admin level)
        const userSettings = await Settings.findOne({ category, user: userId });

        // For API settings, merge services with inheritance flags
        if (category === 'api') {
            const globalServices = globalSettings?.data?.aiServices || [];
            const userServices = userSettings?.data?.aiServices || [];

            // Mark global services as inherited
            const mergedServices = globalServices.map(svc => ({
                ...svc,
                isInherited: true,
                inheritedFrom: 'SuperAdmin'
            }));

            // Add user's own services (not inherited)
            userServices.forEach(svc => {
                mergedServices.push({
                    ...svc,
                    isInherited: false
                });
            });

            // Get sources for inheritance display
            const sources = {};
            globalServices.forEach(svc => {
                sources[svc.id] = 'SuperAdmin (Global)';
            });

            // Merge other API settings (twilio, whatsapp, smtp)
            const mergedData = {
                aiServices: mergedServices,
                twilio: userSettings?.data?.twilio || globalSettings?.data?.twilio || {},
                whatsapp: userSettings?.data?.whatsapp || globalSettings?.data?.whatsapp || {},
                smtp: userSettings?.data?.smtp || globalSettings?.data?.smtp || {}
            };

            return res.json({
                config: mergedData,
                sources
            });
        }

        // For other categories, simple merge (user overrides global)
        const mergedData = {
            ...(globalSettings?.data || {}),
            ...(userSettings?.data || {})
        };

        res.json({ config: mergedData, sources: {} });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Save global settings (SuperAdmin only)
exports.updateSettings = async (req, res) => {
    try {
        const { category } = req.params;
        const data = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        // Check if user is SuperAdmin for global settings
        const userRole = req.user.systemRole || req.user.role;
        if (userRole !== 'SuperAdmin') {
            return res.status(403).json({ error: 'Only SuperAdmin can update global settings' });
        }

        const settings = await Settings.findOneAndUpdate(
            { category, user: null },
            { $set: { data } },
            { new: true, upsert: true }
        );
        res.json(settings.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Save user-scoped settings (Admin level)
exports.saveUserSettings = async (req, res) => {
    try {
        const { category, userId } = req.params;
        const mongoose = require('mongoose');

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const data = req.body;

        if (!req.user) {
            return res.status(401).json({ error: 'Authorization required' });
        }

        // Verify user can only save their own settings (or SuperAdmin can save for anyone)
        const userRole = req.user.systemRole || req.user.role;
        if (userRole !== 'SuperAdmin' && req.user._id.toString() !== userId) {
            return res.status(403).json({ error: 'You can only update your own settings' });
        }

        const settings = await Settings.findOneAndUpdate(
            { category, user: userId },
            { $set: { data } },
            { new: true, upsert: true }
        );
        res.json(settings.data);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
