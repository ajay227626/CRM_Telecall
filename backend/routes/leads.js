const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const checkPermission = require('../middleware/checkPermission');
const leadsController = require('../controllers/leadsController');

router.get('/', auth, checkPermission('leads', 'view'), leadsController.getLeads);
router.post('/', auth, checkPermission('leads', 'create'), leadsController.createLead);
router.post('/bulk', auth, checkPermission('leads', 'import'), leadsController.bulkCreateLeads);
router.post('/delete-multiple', auth, checkPermission('leads', 'delete'), leadsController.deleteMultipleLeads);
router.put('/:id', auth, checkPermission('leads', 'edit'), leadsController.updateLead);
router.delete('/:id', auth, checkPermission('leads', 'delete'), leadsController.deleteLead);

module.exports = router;
