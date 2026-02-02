const Lead = require('../models/Lead');
const Activity = require('../models/Activity');

exports.getLeads = async (req, res) => {
    try {
        const { search, status, category } = req.query;
        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ];
        }
        if (status && status !== 'all') query.status = status;
        if (category && category !== 'all') query.category = category;

        const leads = await Lead.find(query).sort({ createdAt: -1 });
        res.json(leads);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createLead = async (req, res) => {
    try {
        const lead = new Lead(req.body);
        await lead.save();
        res.status(201).json(lead);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateLead = async (req, res) => {
    try {
        // Check if status is being changed
        const existingLead = await Lead.findById(req.params.id);
        if (!existingLead) return res.status(404).json({ error: 'Lead not found' });

        // If status is changing, update statusChangedAt
        const updateData = { ...req.body };
        if (req.body.status && req.body.status !== existingLead.status) {
            updateData.statusChangedAt = new Date();
        }

        const lead = await Lead.findByIdAndUpdate(req.params.id, updateData, { new: true });
        res.json(lead);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteLead = async (req, res) => {
    try {
        await Lead.findByIdAndDelete(req.params.id);

        if (req.user) {
            await Activity.create({
                user: req.user._id,
                action: 'Deleted Lead',
                details: `Deleted lead ${req.params.id}`,
                type: 'system',
                onModel: 'Lead'
            });
        }
        res.json({ message: 'Lead deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.bulkCreateLeads = async (req, res) => {
    try {
        const { leads } = req.body;
        if (!leads || !Array.isArray(leads)) {
            return res.status(400).json({ error: 'Invalid leads data' });
        }
        const createdLeads = await Lead.insertMany(leads);
        res.status(201).json({
            message: `${createdLeads.length} leads created`,
            count: createdLeads.length
        });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteMultipleLeads = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ error: 'Invalid IDs' });
        }
        const result = await Lead.deleteMany({ _id: { $in: ids } });

        if (req.user) {
            await Activity.create({
                user: req.user._id,
                action: 'Bulk Deleted Leads',
                details: `Deleted ${result.deletedCount} leads`,
                type: 'system',
                onModel: 'Lead'
            });
        }
        res.json({ message: `${result.deletedCount} leads deleted` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
