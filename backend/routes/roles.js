const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const roleController = require('../controllers/roleController');

// All routes require authentication
router.use(auth);

// Get all roles (filtered by user's tenant) - view only
router.get('/', checkPermission('users', 'view'), roleController.getRoles);

// Get system roles only
router.get('/system', checkPermission('users', 'view'), roleController.getSystemRoles);

// Create custom role (Admin only)
router.post('/', checkPermission('users', 'manageRoles'), roleController.createRole);

// Get role by ID
router.get('/:id', checkPermission('users', 'view'), roleController.getRoleById);

// Update role permissions
router.put('/:id', checkPermission('users', 'manageRoles'), roleController.updateRole);

// Delete custom role
router.delete('/:id', checkPermission('users', 'manageRoles'), roleController.deleteRole);

module.exports = router;

