const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const requireEntitlement = require('../middleware/entitlementGuard');
const callLogsController = require('../controllers/callLogsController');

router.use(auth);
router.use(requireEntitlement('telecall-crm'));

router.get('/', checkPermission('calls', 'view'), callLogsController.getCallLogs);
router.get('/stats', checkPermission('calls', 'view'), callLogsController.getCallStats);
router.post('/', checkPermission('calls', 'create'), callLogsController.createCallLog);
router.post('/initiate', checkPermission('calls', 'create'), callLogsController.initiateCall);
router.put('/:id', checkPermission('calls', 'edit'), callLogsController.updateCallLog);
router.delete('/:id', checkPermission('calls', 'delete'), callLogsController.deleteCallLog);

module.exports = router;
