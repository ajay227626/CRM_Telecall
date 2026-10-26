const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const requireEntitlement = require('../middleware/entitlementGuard');
const leadsController = require('../controllers/leadsController');

router.use(auth);
router.use(requireEntitlement('telecall-crm'));

router.get('/', checkPermission('leads', 'view'), leadsController.getLeads);
router.post('/', checkPermission('leads', 'create'), leadsController.createLead);
router.post('/bulk', checkPermission('leads', 'import'), leadsController.bulkCreateLeads);
router.post('/delete-multiple', checkPermission('leads', 'delete'), leadsController.deleteMultipleLeads);
router.put('/:id', checkPermission('leads', 'edit'), leadsController.updateLead);
router.delete('/:id', checkPermission('leads', 'delete'), leadsController.deleteLead);

module.exports = router;
