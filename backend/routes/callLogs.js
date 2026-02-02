const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const callLogsController = require('../controllers/callLogsController');

router.get('/', auth, checkPermission('calls', 'view'), callLogsController.getCallLogs);
router.get('/stats', auth, checkPermission('calls', 'view'), callLogsController.getCallStats);
router.post('/', auth, checkPermission('calls', 'create'), callLogsController.createCallLog);
router.post('/initiate', auth, checkPermission('calls', 'create'), callLogsController.initiateCall);
router.put('/:id', auth, checkPermission('calls', 'edit'), callLogsController.updateCallLog);
router.delete('/:id', auth, checkPermission('calls', 'delete'), callLogsController.deleteCallLog);

module.exports = router;
