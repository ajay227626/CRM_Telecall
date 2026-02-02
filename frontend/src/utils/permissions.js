
export const PERMISSIONS = {
    // Leads
    CREATE_LEAD: 'create_lead',
    EDIT_LEAD: 'edit_lead',
    DELETE_LEAD: 'delete_lead',
    VIEW_LEADS: 'view_leads',
    IMPORT_LEADS: 'import_leads',
    EXPORT_LEADS: 'export_leads',

    // Users
    MANAGE_USERS: 'manage_users', // Create/Edit/Delete users
    VIEW_USERS: 'view_users',

    // Settings
    MANAGE_SETTINGS: 'manage_settings',
    MANAGE_SYSTEM_SETTINGS: 'manage_system_settings',
    MANAGE_TEMPLATES: 'manage_templates'
};

export const ROLES = {
    SUPER_ADMIN: 'SuperAdmin',
    ADMIN: 'Admin',
    MODERATOR: 'Moderator',
    USER: 'User'
};

export const getUser = () => {
    try {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    } catch (e) {
        return null;
    }
};

/**
 * Check if the current user has a specific permission
 * @param {string} permission - One of PERMISSIONS constants
 * @returns {boolean}
 */
export const hasPermission = (permission) => {
    const user = getUser();
    if (!user) return false;

    const role = user.role || user.systemRole;

    // 1. SuperAdmin has unrestricted access
    if (role === ROLES.SUPER_ADMIN || user.email === 'ajay22071997barman@gmail.com') return true;

    // 2. Check explicit permissions array (if available from backend)
    if (user.permissions && Array.isArray(user.permissions) && user.permissions.includes(permission)) {
        return true;
    }

    // 3. Fallback: Role-Based Access Control (RBAC) defaults
    // If backend doesn't send detailed permissions, we infer from role

    switch (role) {
        case ROLES.ADMIN:
            // Admin can do almost everything except System Settings
            if (permission === PERMISSIONS.MANAGE_SYSTEM_SETTINGS) return false;
            return true;

        case ROLES.MODERATOR: // Or Manager
            if ([
                PERMISSIONS.CREATE_LEAD,
                PERMISSIONS.EDIT_LEAD,
                PERMISSIONS.VIEW_LEADS,
                PERMISSIONS.VIEW_USERS
            ].includes(permission)) return true;
            return false;

        case ROLES.USER:
            if ([
                PERMISSIONS.CREATE_LEAD, // regular users usually can create leads
                PERMISSIONS.VIEW_LEADS
            ].includes(permission)) return true;
            return false;

        default:
            return false;
    }
};

/**
 * Check if user belongs to one of the allowed roles
 * @param {Array<string>} allowedRoles 
 * @returns {boolean}
 */
export const hasAnyRole = (allowedRoles) => {
    const user = getUser();
    if (!user) return false;
    const role = user.role || user.systemRole;
    if (role === ROLES.SUPER_ADMIN) return true;
    return allowedRoles.includes(role);
};
