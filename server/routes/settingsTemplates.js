const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const settingsTemplateController = require('../controllers/settingsTemplateController');

// All routes require authentication
router.use(auth);

// Get all templates (filtered by user's access)
router.get('/', checkPermission('settings', 'view'), settingsTemplateController.getTemplates);

// Create template
router.post('/', checkPermission('settings', 'edit'), settingsTemplateController.createTemplate);

// Get effective settings for a user
router.get('/effective/:userId/:type', checkPermission('settings', 'view'), settingsTemplateController.getEffectiveSettings);

// Get template by ID
router.get('/:id', checkPermission('settings', 'view'), settingsTemplateController.getTemplateById);

// Update template
router.put('/:id', checkPermission('settings', 'edit'), settingsTemplateController.updateTemplate);

// Delete template
router.delete('/:id', checkPermission('settings', 'edit'), settingsTemplateController.deleteTemplate);

// Apply template to users
router.post('/:id/apply', checkPermission('settings', 'edit'), settingsTemplateController.applyTemplate);

module.exports = router;

