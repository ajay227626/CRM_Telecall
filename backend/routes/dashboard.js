const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const requireEntitlement = require('../middleware/entitlementGuard');
const dashboardController = require('../controllers/dashboardController');

router.use(auth);
router.use(requireEntitlement('telecall-crm'));

router.get('/stats', checkPermission('dashboard', 'view'), dashboardController.getDashboardStats);
router.get('/details/:category', checkPermission('dashboard', 'viewAnalytics'), dashboardController.getDetailedStats);
router.get('/chart-data', checkPermission('dashboard', 'viewAnalytics'), dashboardController.getChartData);

module.exports = router;
