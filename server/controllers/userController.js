const User = require('../models/User');
const Notification = require('../models/Notification');
const Activity = require('../models/Activity');
const bcrypt = require('bcrypt');

// Get all users (original - no filtering)
exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });
        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get single user by ID
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get visible users based on role hierarchy
exports.getVisibleUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};

        if (currentUser.systemRole === 'SuperAdmin') {
            // SuperAdmin can see all users
            query = {};
        } else if (currentUser.systemRole === 'Moderator') {
            // Moderator can see all users (unless restricted)
            if (currentUser.restrictions?.isRestricted) {
                query = { _id: { $in: currentUser.restrictions.canViewUsers } };
            }
        } else if (currentUser.systemRole === 'Admin') {
            // Admin can see only their tenant users
            // BUT hide Super Admin managed users, EXCEPT themselves (since they are likely managed)
            query = {
                tenantId: currentUser._id,
                $or: [
                    { isSuperAdminManaged: { $ne: true } }, // Not managed (or false/null)
                    { _id: currentUser._id } // Self is always visible
                ]
            };
        } else if (currentUser.customRole) {
            // Manager/Custom role - see tenant users (unless restricted)
            if (currentUser.restrictions?.isRestricted) {
                query = { _id: { $in: currentUser.restrictions.canViewUsers } };
            } else {
                query = { tenantId: currentUser.tenantId };
            }
        } else {
            // No access
            return res.json([]);
        }

        const users = await User.find(query)
            .populate('customRole', 'name displayName')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        console.error('Error getting visible users:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get manageable users (users current user can edit/delete)
exports.getManageableUsers = async (req, res) => {
    try {
        const currentUser = req.user;
        let query = {};

        if (currentUser.systemRole === 'SuperAdmin') {
            query = {};
        } else if (currentUser.systemRole === 'Moderator') {
            if (currentUser.restrictions?.isRestricted) {
                query = { _id: { $in: currentUser.restrictions.canManageUsers } };
            }
        } else if (currentUser.systemRole === 'Admin') {
            query = { tenantId: currentUser._id };
        } else if (currentUser.customRole) {
            if (currentUser.restrictions?.isRestricted) {
                query = { _id: { $in: currentUser.restrictions.canManageUsers } };
            } else {
                query = { tenantId: currentUser.tenantId };
            }
        } else {
            return res.json([]);
        }

        const users = await User.find(query)
            .populate('customRole', 'name displayName')
            .sort({ createdAt: -1 });

        res.json(users);
    } catch (err) {
        console.error('Error getting manageable users:', err);
        res.status(500).json({ error: err.message });
    }
};

// Set user restrictions (SuperAdmin/Admin only)
exports.setUserRestrictions = async (req, res) => {
    try {
        const currentUser = req.user;
        const targetUserId = req.params.id;
        const { isRestricted, canViewUsers, canManageUsers } = req.body;

        // Only SuperAdmin and Admin can set restrictions
        if (currentUser.systemRole !== 'SuperAdmin' && currentUser.systemRole !== 'Admin') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Protection Check
        if (targetUser.isSuperAdminManaged && currentUser.systemRole !== 'SuperAdmin') {
            return res.status(403).json({ error: 'This user is managed by Super Admin and cannot be modified.' });
        }

        // SuperAdmin can restrict Moderators
        // Admin can restrict their tenant users
        if (currentUser.systemRole === 'Admin') {
            if (targetUser.tenantId?.toString() !== currentUser._id.toString()) {
                return res.status(403).json({ error: 'Can only restrict your own tenant users' });
            }
        }

        targetUser.restrictions = {
            isRestricted: isRestricted || false,
            canViewUsers: canViewUsers || [],
            canManageUsers: canManageUsers || []
        };

        await targetUser.save();

        if (currentUser) {
            await Activity.create({
                user: currentUser._id,
                action: 'Updated Restrictions',
                details: `Updated restrictions for ${targetUser.name}`,
                type: 'system',
                relatedId: targetUser._id,
                onModel: 'User'
            });
        }

        res.json(targetUser);
    } catch (err) {
        console.error('Error setting restrictions:', err);
        res.status(500).json({ error: err.message });
    }
};

// Get user restrictions
exports.getUserRestrictions = async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('restrictions');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user.restrictions || { isRestricted: false, canViewUsers: [], canManageUsers: [] });
    } catch (err) {
        console.error('Error getting restrictions:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const userData = { ...req.body };

        // Automatically set hierarchy fields based on correct user context
        if (req.user) {
            userData.createdBy = req.user._id;

            if (req.user.systemRole === 'Admin') {
                userData.tenantId = req.user._id;
                userData.parentAdmin = req.user._id;
            } else if (req.user.customRole) {
                // For Managers/Custom Roles
                userData.tenantId = req.user.tenantId;
                userData.parentAdmin = req.user.parentAdmin || req.user.tenantId;
            }
        }

        // Hash password if provided
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, 10);
        }

        const Notification = require('../models/Notification');

        // ... (existing code)

        const user = new User(userData);

        await user.save();

        // Create notification for the admin (or creator)
        if (req.user) {
            await Notification.create({
                user: req.user._id, // Notify the creator (Admin)
                type: 'success',
                title: 'New User Added',
                message: `User ${user.name} joined the team.`,
                read: false
            });

            // Log Activity
            await Activity.create({
                user: req.user._id,
                action: 'Created User',
                details: `Created new user ${user.name} (${user.email})`,
                type: 'system',
                relatedId: user._id,
                onModel: 'User'
            });
        }

        res.status(201).json(user);
    } catch (err) {
        // Handle duplicate email
        if (err.code === 11000) {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(400).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const targetUserId = req.params.id;

        // Fetch user first to check protection
        const existingUser = await User.findById(targetUserId);
        if (!existingUser) return res.status(404).json({ error: 'User not found' });

        // Protection Check
        if (existingUser.isSuperAdminManaged && (!currentUser || currentUser.systemRole !== 'SuperAdmin')) {
            return res.status(403).json({ error: 'This user is managed by Super Admin and cannot be modified.' });
        }

        // Prevent non-SuperAdmins from setting isSuperAdminManaged flag
        if (req.body.isSuperAdminManaged === true && (!currentUser || currentUser.systemRole !== 'SuperAdmin')) {
            delete req.body.isSuperAdminManaged;
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (currentUser) {
            await Activity.create({
                user: currentUser._id,
                action: 'Updated User',
                details: `Updated details for ${user.name}`,
                type: 'system',
                relatedId: user._id,
                onModel: 'User'
            });
        }

        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const currentUser = req.user;
        const targetUser = await User.findById(req.params.id);

        if (!targetUser) return res.status(404).json({ error: 'User not found' });

        // Protection Check
        if (targetUser.isSuperAdminManaged && (!currentUser || currentUser.systemRole !== 'SuperAdmin')) {
            return res.status(403).json({ error: 'This user is managed by Super Admin and cannot be modified.' });
        }

        await User.findByIdAndDelete(req.params.id);

        if (currentUser) {
            // Log Activity
            await Activity.create({
                user: currentUser._id,
                action: 'Deleted User',
                details: `Deleted user ${targetUser.name} (${targetUser.email})`,
                type: 'system',
                relatedId: currentUser._id,
                onModel: 'User'
            });

            // Create Notification
            await Notification.create({
                user: currentUser._id,
                type: 'info',
                title: 'User Deleted',
                message: `User ${targetUser.name} has been removed from the system.`,
                read: false
            });
        }

        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleUserStatus = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Protection Check
        const currentUser = req.user;
        if (user.isSuperAdminManaged && (!currentUser || currentUser.systemRole !== 'SuperAdmin')) {
            return res.status(403).json({ error: 'This user is managed by Super Admin and cannot be modified.' });
        }

        user.status = user.status === 'Active' ? 'Suspended' : 'Active';
        await user.save();

        if (currentUser) {
            await Activity.create({
                user: currentUser._id,
                action: 'Updated Status',
                details: `Changed status of ${user.name} to ${user.status}`,
                type: 'system',
                relatedId: user._id,
                onModel: 'User'
            });
        }

        res.json(user);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

exports.updateUserPermissions = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { permissions: req.body.permissions },
            { new: true }
        );
        res.json(user);

        if (req.user) {
            await Activity.create({
                user: req.user._id,
                action: 'Updated Permissions',
                details: `Updated permissions for ${user.name}`,
                type: 'system',
                relatedId: user._id,
                onModel: 'User'
            });
        }
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
