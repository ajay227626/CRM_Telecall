const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const auth = require('../middleware/auth');
const requireEntitlement = require('../middleware/entitlementGuard');

router.use(auth);
router.use(requireEntitlement('telecall-crm'));

router.get('/', activityController.getActivities);

module.exports = router;
