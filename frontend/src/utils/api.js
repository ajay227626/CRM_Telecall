const API_BASE = `${import.meta.env.VITE_API_URL}/api`;
import notify from './toast.jsx';

// Helper function to get the token from localStorage
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Helper function to create headers with the authorization token
const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
};

// Settings API
export const getSettings = async (category) => {
    try {
        const response = await fetch(`${API_BASE}/settings/${category}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch settings');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching ${category} settings:`, error);
        notify.error(`Failed to fetch ${category} settings`);
        throw error;
    }
};

export const saveSettings = async (category, data) => {
    try {
        const response = await fetch(`${API_BASE}/settings/${category}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save settings');
        return await response.json();
    } catch (error) {
        console.error(`Error saving ${category} settings:`, error);
        notify.error(`Failed to save ${category} settings`);
        throw error;
    }
};

// Get effective settings with inheritance (global + user merged)
export const getEffectiveApiSettings = async (category, userId) => {
    try {
        const response = await fetch(`${API_BASE}/settings/${category}/effective/${userId}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch effective settings');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching effective ${category} settings:`, error);
        notify.error(`Failed to fetch effective settings`);
        throw error;
    }
};

// Save user-scoped settings (Admin level)
export const saveUserSettings = async (category, userId, data) => {
    try {
        const response = await fetch(`${API_BASE}/settings/${category}/user/${userId}`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(data)
        });
        if (!response.ok) throw new Error('Failed to save user settings');
        return await response.json();
    } catch (error) {
        console.error(`Error saving user ${category} settings:`, error);
        notify.error(`Failed to save user ${category} settings`);
        throw error;
    }
};


// Users API
export const getUsers = async () => {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch users');
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        notify.error('Failed to fetch users');
        throw error;
    }
};

export const createUser = async (userData) => {
    try {
        const response = await fetch(`${API_BASE}/users`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create user');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating user:', error);
        notify.error(error.message || 'Failed to create user');
        throw error;
    }
};

export const updateUser = async (id, userData) => {
    try {
        const response = await fetch(`${API_BASE}/users/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(userData)
        });
        if (!response.ok) throw new Error('Failed to update user');
        return await response.json();
    } catch (error) {
        console.error('Error updating user:', error);
        notify.error('Failed to update user');
        throw error;
    }
};

export const deleteUser = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/users/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete user');
        return await response.json();
    } catch (error) {
        console.error('Error deleting user:', error);
        notify.error('Failed to delete user');
        throw error;
    }
};

export const toggleUserStatus = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/users/${id}/toggle-status`, {
            method: 'PATCH',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to toggle user status');
        return await response.json();
    } catch (error) {
        console.error('Error toggling user status:', error);
        notify.error('Failed to toggle user status');
        throw error;
    }
};

export const updateUserPermissions = async (id, permissions) => {
    try {
        const response = await fetch(`${API_BASE}/users/${id}/permissions`, {
            method: 'PATCH',
            headers: getAuthHeaders(),
            body: JSON.stringify({ permissions })
        });
        if (!response.ok) throw new Error('Failed to update user permissions');
        return await response.json();
    } catch (error) {
        console.error('Error updating user permissions:', error);
        notify.error('Failed to update user permissions');
        throw error;
    }
};

export const getUserRestrictions = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/users/${id}/restrictions`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch user restrictions');
        return await response.json();
    } catch (error) {
        console.error('Error fetching user restrictions:', error);
        notify.error('Failed to fetch user restrictions');
        throw error;
    }
};

export const setUserRestrictions = async (id, restrictions) => {
    try {
        const response = await fetch(`${API_BASE}/users/${id}/restrictions`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(restrictions)
        });
        if (!response.ok) throw new Error('Failed to set user restrictions');
        return await response.json();
    } catch (error) {
        console.error('Error setting user restrictions:', error);
        notify.error('Failed to set user restrictions');
        throw error;
    }
};

// Leads API
export const getLeads = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE}/leads?${queryString}` : `${API_BASE}/leads`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch leads');
        return await response.json();
    } catch (error) {
        console.error('Error fetching leads:', error);
        throw error;
    }
};

export const createLead = async (leadData) => {
    try {
        const response = await fetch(`${API_BASE}/leads`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(leadData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to create lead');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating lead:', error);
        throw error;
    }
};

export const updateLead = async (id, leadData) => {
    try {
        const response = await fetch(`${API_BASE}/leads/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(leadData)
        });
        if (!response.ok) throw new Error('Failed to update lead');
        return await response.json();
    } catch (error) {
        console.error('Error updating lead:', error);
        throw error;
    }
};

export const deleteLead = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/leads/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete lead');
        return await response.json();
    } catch (error) {
        console.error('Error deleting lead:', error);
        throw error;
    }
};

export const bulkCreateLeads = async (leads) => {
    try {
        const response = await fetch(`${API_BASE}/leads/bulk`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ leads })
        });
        if (!response.ok) throw new Error('Failed to bulk create leads');
        return await response.json();
    } catch (error) {
        console.error('Error bulk creating leads:', error);
        throw error;
    }
};

export const deleteMultipleLeads = async (ids) => {
    try {
        const response = await fetch(`${API_BASE}/leads/delete-multiple`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ ids })
        });
        if (!response.ok) throw new Error('Failed to delete leads');
        return await response.json();
    } catch (error) {
        console.error('Error deleting leads:', error);
        throw error;
    }
};

// Call Logs API
export const getCallLogs = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE}/call-logs?${queryString}` : `${API_BASE}/call-logs`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch call logs');
        return await response.json();
    } catch (error) {
        console.error('Error fetching call logs:', error);
        throw error;
    }
};

export const getCallStats = async () => {
    try {
        const response = await fetch(`${API_BASE}/call-logs/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch call stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching call stats:', error);
        throw error;
    }
};

export const createCallLog = async (callData) => {
    try {
        const response = await fetch(`${API_BASE}/call-logs`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(callData)
        });
        if (!response.ok) throw new Error('Failed to create call log');
        return await response.json();
    } catch (error) {
        console.error('Error creating call log:', error);
        throw error;
    }
};

export const initiateCall = async (callData) => {
    try {
        const response = await fetch(`${API_BASE}/call-logs/initiate`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(callData)
        });
        if (!response.ok) throw new Error('Failed to initiate call');
        return await response.json();
    } catch (error) {
        console.error('Error initiating call:', error);
        throw error;
    }
};

export const updateCallLog = async (id, callData) => {
    try {
        const response = await fetch(`${API_BASE}/call-logs/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(callData)
        });
        if (!response.ok) throw new Error('Failed to update call log');
        return await response.json();
    } catch (error) {
        console.error('Error updating call log:', error);
        throw error;
    }
};

// Dashboard API
export const getDashboardStats = async () => {
    try {
        const response = await fetch(`${API_BASE}/dashboard/stats`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        throw error;
    }
};

export const getDashboardDetails = async (category) => {
    try {
        const response = await fetch(`${API_BASE}/dashboard/details/${category}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch dashboard details');
        return await response.json();
    } catch (error) {
        console.error('Error fetching dashboard details:', error);
        throw error;
    }
};

export const getChartData = async (range, type, customRange = null) => {
    try {
        let url = `${API_BASE}/dashboard/chart-data?range=${range}&type=${type}`;
        if (range === 'custom' && customRange) {
            // Ensure dates are strings YYYY-MM-DD
            const from = customRange.from instanceof Date ? customRange.from.toISOString().split('T')[0] : customRange.from;
            const to = customRange.to instanceof Date ? customRange.to.toISOString().split('T')[0] : customRange.to;
            url += `&from=${from}&to=${to}`;
        }

        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch chart data');
        return await response.json();
    } catch (error) {
        console.error('Error fetching chart data:', error);
        throw error;
    }
};

// Auth API
export const sendOTP = async (email) => {
    try {
        const response = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Failed to send OTP');
        return await response.json();
    } catch (error) {
        console.error('Error sending OTP:', error);
        throw error;
    }
};

export const initiatePasswordReset = async (email) => {
    try {
        const response = await fetch(`${API_BASE}/auth/initiate-password-reset`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        if (!response.ok) throw new Error('Failed to initiate password reset');
        return await response.json();
    } catch (error) {
        console.error('Error initiating password reset:', error);
        throw error;
    }
};

export const verifyOTPAndResetPassword = async (email, code, newPassword) => {
    try {
        const response = await fetch(`${API_BASE}/auth/verify-otp-reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code, newPassword })
        });
        if (!response.ok) throw new Error('Failed to verify OTP and reset password');
        return await response.json();
    } catch (error) {
        console.error('Error verifying OTP and resetting password:', error);
        throw error;
    }
};

export const login = async (email, password) => {
    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Failed to login');
        return await response.json();
    } catch (error) {
        console.error('Error logging in:', error);
        notify.error(error.message || 'Login failed');
        throw error;
    }
};

export const verifyOTP = async (email, code) => {
    try {
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, code })
        });
        if (!response.ok) throw new Error('Failed to verify OTP');
        return await response.json();
    } catch (error) {
        console.error('Error verifying OTP:', error);
        throw error;
    }
};

// Upload avatar
export const uploadAvatar = async (file) => {
    try {
        const formData = new FormData();
        formData.append('avatar', file);

        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/auth/upload-avatar`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
                // Note: Don't set Content-Type for FormData, browser will set it with boundary
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to upload avatar');
        }
        return await response.json();
    } catch (error) {
        console.error('Error uploading avatar:', error);
        throw error;
    }
};

// Select avatar from history
export const selectAvatar = async (avatarUrl) => {
    try {
        const token = getAuthToken();
        const response = await fetch(`${API_BASE}/auth/select-avatar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ avatarUrl })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to select avatar');
        }
        return await response.json();
    } catch (error) {
        console.error('Error selecting avatar:', error);
        throw error;
    }
};

// Account Management API
export const deactivateAccount = async () => {
    try {
        const response = await fetch(`${API_BASE}/auth/deactivate`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to deactivate account');
        return await response.json();
    } catch (error) {
        console.error('Error deactivating account:', error);
        throw error;
    }
};

export const requestDeleteAccount = async () => {
    try {
        const response = await fetch(`${API_BASE}/auth/request-delete`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to request account deletion');
        return await response.json();
    } catch (error) {
        console.error('Error requesting account deletion:', error);
        throw error;
    }
};

export const confirmDeleteAccount = async (otp, confirmationString) => {
    try {
        const response = await fetch(`${API_BASE}/auth/confirm-delete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ otp, confirmationString })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to delete account');
        }
        return await response.json();
    } catch (error) {
        console.error('Error confirming account deletion:', error);
        throw error;
    }
};

// Account Linking & Password Management
export const unlinkProvider = async (provider) => {
    try {
        const response = await fetch(`${API_BASE}/auth/unlink`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ provider })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to unlink account');
        }
        return await response.json();
    } catch (error) {
        console.error('Error unlinking account:', error);
        throw error;
    }
};

export const requestSetPasswordOTP = async () => {
    try {
        const response = await fetch(`${API_BASE}/auth/password/set-request`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to request OTP');
        return await response.json();
    } catch (error) {
        console.error('Error requesting OTP:', error);
        throw error;
    }
};

export const verifyAndSetPassword = async (otp, newPassword) => {
    try {
        const response = await fetch(`${API_BASE}/auth/password/set-confirm`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ otp, newPassword })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to set password');
        }
        return await response.json();
    } catch (error) {
        console.error('Error setting password:', error);
        throw error;
    }
};

export const initiateChangePassword = async (currentPassword, newPassword) => {
    try {
        const response = await fetch(`${API_BASE}/auth/password/change-init`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to initiate password change');
        }
        return await response.json();
    } catch (error) {
        console.error('Error initiating password change:', error);
        throw error;
    }
};

export const finalizeChangePassword = async (otp, newPassword) => {
    try {
        const response = await fetch(`${API_BASE}/auth/password/change-confirm`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ otp, newPassword })
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to change password');
        }
        return await response.json();
    } catch (error) {
        console.error('Error finalizing password change:', error);
        throw error;
    }
};

// Security Verification API
export const requestSecurityOTP = async () => {
    try {
        const response = await fetch(`${API_BASE}/auth/security/request-otp`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Failed to request security OTP');
        }
        return await response.json();
    } catch (error) {
        console.error('Error requesting security OTP:', error);
        throw error;
    }
};

export const verifySecurityAction = async (credential) => {
    try {
        const response = await fetch(`${API_BASE}/auth/security/verify`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(credential)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.error || 'Verification failed');
        }
        return await response.json();
    } catch (error) {
        console.error('Error verifying security action:', error);
        throw error;
    }
};

// Settings Templates API
export const getTemplates = async (params = {}) => {
    try {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${API_BASE}/settings-templates?${queryString}` : `${API_BASE}/settings-templates`;
        const response = await fetch(url, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch templates');
        return await response.json();
    } catch (error) {
        console.error('Error fetching templates:', error);
        throw error;
    }
};

export const createTemplate = async (templateData) => {
    try {
        const response = await fetch(`${API_BASE}/settings-templates`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify(templateData)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to create template');
        }
        return await response.json();
    } catch (error) {
        console.error('Error creating template:', error);
        throw error;
    }
};

export const updateTemplate = async (id, templateData) => {
    try {
        const response = await fetch(`${API_BASE}/settings-templates/${id}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify(templateData)
        });
        if (!response.ok) throw new Error('Failed to update template');
        return await response.json();
    } catch (error) {
        console.error('Error updating template:', error);
        throw error;
    }
};

export const deleteTemplate = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/settings-templates/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete template');
        return await response.json();
    } catch (error) {
        console.error('Error deleting template:', error);
        throw error;
    }
};

export const getEffectiveSettings = async (userId, type) => {
    try {
        const response = await fetch(`${API_BASE}/settings-templates/effective/${userId}/${type}`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch effective settings');
        return await response.json();
    } catch (error) {
        console.error('Error fetching effective settings:', error);
        throw error;
    }
};

// Notifications API
export const getNotifications = async () => {
    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to fetch notifications');
        return await response.json();
    } catch (error) {
        console.error(`Error fetching notification:`, error);
        notify.error('Failed to communicate with server');
        throw error;
    }
};

export const markNotificationRead = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/notifications/${id}/read`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to mark notification as read');
        return await response.json();
    } catch (error) {
        console.error('Error marking notification as read:', error);
        throw error;
    }
};

export const markAllNotificationsRead = async () => {
    try {
        const response = await fetch(`${API_BASE}/notifications/read-all`, {
            method: 'PUT',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to mark all notifications as read');
        return await response.json();
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
    }
};

export const deleteNotification = async (id) => {
    try {
        const response = await fetch(`${API_BASE}/notifications/${id}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (!response.ok) throw new Error('Failed to delete notification');
        return await response.json();
    } catch (error) {
        console.error('Error deleting notification:', error);
        throw error;
    }
};


