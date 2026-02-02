const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const dashboardController = require('../controllers/dashboardController');

router.get('/stats', auth, checkPermission('dashboard', 'view'), dashboardController.getDashboardStats);
router.get('/details/:category', auth, checkPermission('dashboard', 'viewAnalytics'), dashboardController.getDetailedStats);
router.get('/chart-data', auth, checkPermission('dashboard', 'viewAnalytics'), dashboardController.getChartData);

module.exports = router;
