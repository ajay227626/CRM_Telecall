const SettingsTemplate = require('../models/SettingsTemplate');
const User = require('../models/User');
const Settings = require('../models/Settings'); // Assumed model logic, might need adjustment

exports.createTemplate = async (req, res) => {
    try {
        const { name, description, type, level, config, targetRole, priority } = req.body;
        // console.log('Create Template Body:', req.body); // DEBUG LOG
        // console.log('User Creating Template:', req.user); // DEBUG LOG

        // Role-based validation for template levels
        // SuperAdmin -> System
        // Admin -> Organization
        // Manager -> Group

        const userRole = req.user.systemRole; // Assuming auth middleware populates this

        if (level === 'system' && userRole !== 'SuperAdmin') {
            return res.status(403).json({ message: 'Access denied. Only SuperAdmin can create System templates.' });
        }

        if (level === 'organization' && !['SuperAdmin', 'Admin'].includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. Only Admins can create Organization templates.' });
        }

        if (level === 'group' && !['SuperAdmin', 'Admin', 'Manager', 'Moderator'].includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. Insufficient permissions to create Group templates.' });
        }

        const template = new SettingsTemplate({
            name,
            description,
            type,
            level,
            config: config || {},
            targetRole,
            priority,
            createdBy: req.user._id
        });

        await template.save();
        res.status(201).json(template);

    } catch (error) {
        // Handle duplicate key error
        if (error.code === 11000) {
            return res.status(400).json({ message: 'A template with this name already exists for your account.' });
        }

        // Handle Mongoose Validation Errors explicitly
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ message: 'Validation Error', errors: messages });
        }

        console.error('Create Template Error:', error);
        res.status(500).json({ message: `Server error creating template: ${error.message}`, error: error.toString() });
    }
};

exports.getTemplates = async (req, res) => {
    try {
        const { type } = req.query;
        const userRole = req.user.systemRole;
        const userId = req.user._id;

        let query = {};

        // Filtering by type if provided
        if (type) query.type = type;

        // Visibility Logic for Management:
        // SuperAdmin: Sees ALL templates
        // Admin: Sees System templates (read-only?) + Own templates
        // Manager: Sees System/Org templates (read-only?) + Own templates

        // For Management UI, we usually want to see what we can EDIT.
        // But we might want to see what we inherit from too.

        if (userRole === 'SuperAdmin') {
            // See everything
        } else {
            // See templates created by self OR templates that apply to hierarchy?
            // For simplicty v1: Users see templates they created.
            query.createdBy = userId;
        }

        const templates = await SettingsTemplate.find(query).sort({ priority: -1, createdAt: -1 });
        res.json(templates);

    } catch (error) {
        console.error('Get Templates Error:', error);
        res.status(500).json({ message: 'Server error fetching templates' });
    }
};

exports.getTemplateById = async (req, res) => {
    try {
        const template = await SettingsTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Simple authorization check
        if (req.user.systemRole !== 'SuperAdmin' && template.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        res.json(template);
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching template' });
    }
};

exports.updateTemplate = async (req, res) => {
    try {
        const { name, description, config, targetRole, priority, isActive } = req.body;

        let template = await SettingsTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Authorization
        if (req.user.systemRole !== 'SuperAdmin' && template.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied. You can only update your own templates.' });
        }

        // Update fields
        if (name) template.name = name;
        if (description !== undefined) template.description = description;
        if (config) template.config = config;
        if (targetRole) template.targetRole = targetRole;
        if (priority !== undefined) template.priority = priority;
        if (isActive !== undefined) template.isActive = isActive;

        await template.save();
        res.json(template);

    } catch (error) {
        console.error('Update Template Error:', error);
        res.status(500).json({ message: 'Server error updating template' });
    }
};

exports.deleteTemplate = async (req, res) => {
    try {
        const template = await SettingsTemplate.findById(req.params.id);
        if (!template) return res.status(404).json({ message: 'Template not found' });

        // Authorization
        if (req.user.systemRole !== 'SuperAdmin' && template.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Access denied' });
        }

        await template.deleteOne();
        res.json({ message: 'Template deleted successfully' });

    } catch (error) {
        console.error('Delete Template Error:', error);
        res.status(500).json({ message: 'Server error deleting template' });
    }
};

exports.getEffectiveSettings = async (req, res) => {
    try {
        const { userId, type } = req.params;

        // Retrieve the target user and their hierarchy
        const user = await User.findById(userId).populate('parentAdmin');
        if (!user) return res.status(404).json({ message: 'User not found' });

        // 1. Fetch System Default (Lowest Priority)
        const systemTemplate = await SettingsTemplate.findOne({
            type,
            level: 'system',
            isActive: true
        }).sort({ priority: -1 });

        // 2. Fetch Organization/Admin Template
        let orgTemplate = null;
        if (user.parentAdmin) {
            orgTemplate = await SettingsTemplate.findOne({
                type,
                level: 'organization',
                createdBy: user.parentAdmin._id,
                isActive: true
            }).sort({ priority: -1 });
        }

        // 3. Fetch Group/Manager Template
        // (Assuming we track 'manager' in user model. For now, skipping or using createdBy if manager)
        let groupTemplate = null;
        if (user.createdBy && user.createdBy.toString() !== (user.parentAdmin?._id.toString())) {
            // If createdBy is different from parentAdmin, assume it's a Manager
            groupTemplate = await SettingsTemplate.findOne({
                type,
                level: 'group',
                createdBy: user.createdBy,
                isActive: true
            }).sort({ priority: -1 });
        }

        // 4. Fetch User's Personal Settings (Highest Priority)
        const userSettingsDoc = await Settings.findOne({ user: userId, category: type });
        const userSettings = userSettingsDoc ? userSettingsDoc.data : {};

        // Merge Logic: System < Org < Group < User
        const effectiveConfig = {
            ...(systemTemplate?.config || {}),
            ...(orgTemplate?.config || {}),
            ...(groupTemplate?.config || {}),
            ...userSettings // Flattened or deep merge? Shallow merge for v1
        };

        res.json({
            config: effectiveConfig,
            sources: {
                system: systemTemplate?._id,
                organization: orgTemplate?._id,
                group: groupTemplate?._id,
                user: !!userSettings // boolean
            }
        });

    } catch (error) {
        console.error('Get Effective Settings Error:', error);
        res.status(500).json({ message: 'Server error calculating settings' });
    }
};

exports.applyTemplate = async (req, res) => {
    try {
        // Stub implementation
        // This could be used to explicit copy template config to user's settings
        res.status(501).json({ message: 'Apply template not implemented yet' });
    } catch (error) {
        res.status(500).json({ message: 'Server error applying template' });
    }
};
