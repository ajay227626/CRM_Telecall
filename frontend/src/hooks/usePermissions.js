import { useState, useEffect } from 'react';

/**
 * Hook to check user permissions
 * @returns {Object} Permission checking functions
 */
export const usePermissions = () => {
    // Initialize user synchronously to prevent flash of unpermitted content
    const [user, setUser] = useState(() => {
        try {
            const userStr = localStorage.getItem('user');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error parsing user from localStorage:', error);
            return null;
        }
    });

    // Re-sync if localStorage changes (e.g., from another tab or role switch)
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const userStr = localStorage.getItem('user');
                setUser(userStr ? JSON.parse(userStr) : null);
            } catch (error) {
                console.error('Error parsing user from localStorage:', error);
            }
        };
        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);


    /**
     * Check if user has specific permission
     * @param {string} resource - Resource name (leads, calls, users, reports, settings, dashboard)
     * @param {string} action - Action name (view, create, edit, delete, etc.)
     * @returns {boolean} True if user has permission
     */
    const hasPermission = (resource, action) => {
        if (!user) return false;

        // Check both role and systemRole for compatibility
        const userRole = user.systemRole || user.role;

        // SuperAdmin has full access
        if (userRole === 'SuperAdmin') {
            return true;
        }

        //Admin has full access (can be customized later)
        if (userRole === 'Admin') {
            return true;
        }

        // For custom roles, check granular permissions
        if (user.customRole && user.customRole.permissions) {
            return user.customRole.permissions?.[resource]?.[action] === true;
        }

        // Moderator default permissions
        if (userRole === 'Moderator') {
            const moderatorPermissions = {
                leads: ['view', 'create', 'edit'],
                calls: ['view', 'create'],
                dashboard: ['view']
            };
            return moderatorPermissions[resource]?.includes(action) || false;
        }

        // Guest default permissions
        if (userRole === 'Guest') {
            const guestPermissions = {
                leads: ['view'],
                calls: ['view'],
                dashboard: ['view']
            };
            return guestPermissions[resource]?.includes(action) || false;
        }

        // Default deny
        return false;
    };

    /**
     * Check if user has any permission in a resource
     * @param {string} resource - Resource name
     * @returns {boolean} True if user has any permission for the resource
     */
    const hasAnyPermission = (resource) => {
        if (!user) return false;

        const userRole = user.systemRole || user.role;

        if (userRole === 'SuperAdmin' || userRole === 'Admin') {
            return true;
        }

        // Check if customRole has any permission for resource
        if (user.customRole && user.customRole.permissions?.[resource]) {
            const perms = user.customRole.permissions[resource];
            return Object.values(perms).some(p => p === true);
        }

        return false;
    };

    /**
     * Check if user is SuperAdmin
     * @returns {boolean} True if SuperAdmin
     */
    const isSuperAdmin = () => {
        const userRole = user?.systemRole || user?.role;
        return userRole === 'SuperAdmin';
    };

    /**
     * Check if user is Admin or SuperAdmin
     * @returns {boolean} True if Admin or SuperAdmin
     */
    const isAdmin = () => {
        const userRole = user?.systemRole || user?.role;
        return userRole === 'Admin' || userRole === 'SuperAdmin';
    };

    return {
        hasPermission,
        hasAnyPermission,
        isSuperAdmin,
        isAdmin
    };
};

export default usePermissions;
