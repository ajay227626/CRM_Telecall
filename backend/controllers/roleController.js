const Role = require('../models/Role');
const User = require('../models/User');

// Get all roles (filtered by tenant for custom roles)
exports.getRoles = async (req, res) => {
    try {
        const user = req.user;
        let query = {};

        if (user.systemRole === 'SuperAdmin' || user.systemRole === 'Moderator') {
            // SuperAdmin and Moderator can see all roles
            query = {};
        } else if (user.systemRole === 'Admin') {
            // Admin can see system roles + their custom roles
            query = {
                $or: [
                    { isSystemRole: true },
                    { tenantId: user._id }
                ]
            };
        } else {
            // Regular users can only see system roles
            query = { isSystemRole: true };
        }

        const roles = await Role.find(query).sort({ isSystemRole: -1, name: 1 });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

// Create custom role (Admin only)
exports.createRole = async (req, res) => {
    try {
        const user = req.user;

        // Only Admin can create custom roles
        if (user.systemRole !== 'Admin') {
            return res.status(403).json({ error: 'Only Admins can create custom roles' });
        }

        const { name, displayName, description, permissions } = req.body;

        // Check if role name already exists for this tenant
        const existing = await Role.findOne({
            name: name,
            tenantId: user._id
        });

        if (existing) {
            return res.status(400).json({ error: 'Role name already exists' });
        }

        const role = await Role.create({
            name,
            displayName,
            description,
            isSystemRole: false,
            createdBy: user._id,
            tenantId: user._id,
            permissions
        });

        res.status(201).json(role);
    } catch (error) {
        console.error('Error creating role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

// Get role by ID
exports.getRoleById = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Check access
        const user = req.user;
        if (!role.isSystemRole && role.tenantId.toString() !== user._id.toString()) {
            if (user.systemRole !== 'SuperAdmin' && user.systemRole !== 'Moderator') {
                return res.status(403).json({ error: 'Access denied' });
            }
        }

        res.json(role);
    } catch (error) {
        console.error('Error fetching role:', error);
        res.status(500).json({ error: 'Failed to fetch role' });
    }
};

// Update role permissions
exports.updateRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Cannot update system roles
        if (role.isSystemRole) {
            return res.status(403).json({ error: 'Cannot modify system roles' });
        }

        // Check ownership
        const user = req.user;
        if (role.tenantId.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const { displayName, description, permissions } = req.body;

        role.displayName = displayName || role.displayName;
        role.description = description || role.description;
        role.permissions = permissions || role.permissions;

        await role.save();
        res.json(role);
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};

// Delete custom role
exports.deleteRole = async (req, res) => {
    try {
        const role = await Role.findById(req.params.id);

        if (!role) {
            return res.status(404).json({ error: 'Role not found' });
        }

        // Cannot delete system roles
        if (role.isSystemRole) {
            return res.status(403).json({ error: 'Cannot delete system roles' });
        }

        // Check ownership
        const user = req.user;
        if (role.tenantId.toString() !== user._id.toString()) {
            return res.status(403).json({ error: 'Access denied' });
        }

        // Check if any users are assigned to this role
        const usersWithRole = await User.countDocuments({ customRole: role._id });
        if (usersWithRole > 0) {
            return res.status(400).json({
                error: `Cannot delete role. ${usersWithRole} user(s) are assigned to this role.`
            });
        }

        await Role.findByIdAndDelete(req.params.id);
        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting role:', error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};

// Get system roles
exports.getSystemRoles = async (req, res) => {
    try {
        const roles = await Role.find({ isSystemRole: true }).sort({ name: 1 });
        res.json(roles);
    } catch (error) {
        console.error('Error fetching system roles:', error);
        res.status(500).json({ error: 'Failed to fetch system roles' });
    }
};
