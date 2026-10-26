const Role = require('../models/Role');

/**
 * Middleware to check if user has specific permission
 * @param {string} resource - Resource name (leads, calls, users, reports, settings, dashboard)
 * @param {string} action - Action name (view, create, edit, delete, etc.)
 */
const checkPermission = (resource, action) => {
    return async (req, res, next) => {
        try {
            const user = req.user;

            if (!user) {
                return res.status(401).json({ error: 'Authentication required' });
            }

            // SuperAdmin bypass - full access to everything
            if (user.systemRole === 'SuperAdmin') {
                return next();
            }

            // Admin has full access (for now, can be customized later)
            if (user.systemRole === 'Admin') {
                return next();
            }

            // For users with custom roles, check granular permissions
            if (user.customRole) {
                const role = await Role.findById(user.customRole);

                if (!role) {
                    return res.status(403).json({ error: 'Role not found' });
                }

                // Check if role has the required permission
                const hasPermission = role.permissions?.[resource]?.[action] === true;

                if (!hasPermission) {
                    return res.status(403).json({
                        error: 'Access denied',
                        message: `You do not have permission to ${action} ${resource}`
                    });
                }

                return next();
            }

            // For Moderator and Guest - deny by default unless explicitly allowed
            // This will need customization based on business rules
            if (user.systemRole === 'Moderator') {
                // Moderators have limited access - customize as needed
                const moderatorPermissions = {
                    leads: ['view', 'create', 'edit'],
                    calls: ['view', 'create'],
                    dashboard: ['view']
                };

                if (moderatorPermissions[resource]?.includes(action)) {
                    return next();
                }
            }

            // Guest users - very limited access
            if (user.systemRole === 'Guest') {
                const guestPermissions = {
                    leads: ['view'],
                    calls: ['view'],
                    dashboard: ['view']
                };

                if (guestPermissions[resource]?.includes(action)) {
                    return next();
                }
            }

            // Default deny
            return res.status(403).json({
                error: 'Access denied',
                message: `Insufficient permissions to ${action} ${resource}`
            });

        } catch (error) {
            console.error('Permission check error:', error);
            return res.status(500).json({ error: 'Permission check failed' });
        }
    };
};

module.exports = checkPermission;
