const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const userController = require('../controllers/userController');

// Visibility & Restrictions
router.get('/visible', auth, checkPermission('users', 'view'), userController.getVisibleUsers);
router.get('/manageable', auth, checkPermission('users', 'edit'), userController.getManageableUsers);
router.post('/:id/restrictions', auth, checkPermission('users', 'edit'), userController.setUserRestrictions);
router.get('/:id/restrictions', auth, checkPermission('users', 'view'), userController.getUserRestrictions);

// Standard CRUD
router.get('/', auth, checkPermission('users', 'view'), userController.getUsers);
router.get('/:id', auth, checkPermission('users', 'view'), userController.getUserById);
router.post('/', auth, checkPermission('users', 'create'), userController.createUser);
router.put('/:id', auth, checkPermission('users', 'edit'), userController.updateUser);
router.delete('/:id', auth, checkPermission('users', 'delete'), userController.deleteUser);
router.patch('/:id/toggle-status', auth, checkPermission('users', 'edit'), userController.toggleUserStatus);
router.patch('/:id/permissions', auth, checkPermission('users', 'manageRoles'), userController.updateUserPermissions);

module.exports = router;
