const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const settingsController = require('../controllers/settingsController');

// Middleware to conditionally apply auth and permissions
const conditionalAuthAndPermission = (req, res, next) => {
    const { category } = req.params;
    const publicCategories = ['system', 'calling', 'lead', 'api'];

    if (publicCategories.includes(category)) {
        // Skip authentication for public categories
        next();
    } else {
        // Apply authentication for other categories
        auth(req, res, (err) => {
            if (err) return next(err);
            // Then check permission
            checkPermission('settings', 'view')(req, res, next);
        });
    }
};

// IMPORTANT: More specific routes MUST come before generic :category route

// Get effective settings (merged: global + user overrides)
router.get('/:category/effective/:userId', auth, settingsController.getEffectiveSettings);

// Save user-scoped settings (Admin level)
router.post('/:category/user/:userId', auth, settingsController.saveUserSettings);

// Get global settings (generic - should be last)
router.get('/:category', conditionalAuthAndPermission, settingsController.getSettings);

// Save global settings (SuperAdmin only)
router.post('/:category', auth, checkPermission('settings', 'edit'), settingsController.updateSettings);

module.exports = router;

