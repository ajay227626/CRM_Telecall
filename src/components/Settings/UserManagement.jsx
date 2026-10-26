import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getUsers, createUser, updateUser, deleteUser, sendOTP, toggleUserStatus, updateUserPermissions } from '../../utils/api';
import notify from '../../utils/toast.jsx';
import { useAppearance } from '../../context/AppearanceContext';
import { hasPermission, PERMISSIONS, getUser, ROLES } from '../../utils/permissions';
import SectionHeader from './SectionHeader';
import ConfirmationModal from '../Shared/ConfirmationModal';
import InputModal from '../Shared/InputModal';

const currentUser = getUser();
const isSuperAdmin = currentUser?.systemRole === ROLES.SUPER_ADMIN || currentUser?.email === 'ajay22071997barman@gmail.com';

const UserManagement = () => {
    const { theme } = useAppearance();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    // const [toast, setToast] = useState(null);
    const [users, setUsers] = useState([]);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [inputModal, setInputModal] = useState({ isOpen: false, title: '', message: '', initialValue: '', onSubmit: null });
    const [showUserForm, setShowUserForm] = useState(false); // Can be removed/deprecated if not used, or kept for consistency if referenced
    const [error, setError] = useState(null);
    const [configuringRole, setConfiguringRole] = useState(null);

    // New Modals State
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showRestrictModal, setShowRestrictModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);

    // Data State for Actions
    const [selectedUserForAction, setSelectedUserForAction] = useState(null);
    const [newUserData, setNewUserData] = useState({ name: '', email: '', password: '', role: 'Telecaller', phone: '', department: '', status: 'Active', isSuperAdminManaged: false, requirePasswordReset: false, authMethod: 'Password' });
    const [editUserData, setEditUserData] = useState({ name: '', email: '', role: 'Telecaller', phone: '', department: '', status: 'Active', isSuperAdminManaged: false, requirePasswordReset: false, authMethod: 'Password' });
    const [restrictionData, setRestrictionData] = useState({ canMakeCalls: true, canEditLeads: true, canDeleteLeads: false, canViewReports: true, canExport: false });
    // Departments state
    const [departments, setDepartments] = useState([
        { id: 1, name: 'Sales', status: 'Active' },
        { id: 2, name: 'Marketing', status: 'Active' },
        { id: 3, name: 'Support', status: 'Active' },
        { id: 4, name: 'Operations', status: 'Active' },
        { id: 5, name: 'Finance', status: 'Active' },
        { id: 6, name: 'HR', status: 'Active' },
        { id: 7, name: 'IT', status: 'Active' },
        { id: 8, name: 'Management', status: 'Active' }
    ]);
    const [openDropdownId, setOpenDropdownId] = useState(null);

    // Auto-Generate Password Helper
    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let password = "";
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    };

    // Add Role State
    const [showAddRoleModal, setShowAddRoleModal] = useState(false);
    const [newRoleData, setNewRoleData] = useState({
        name: '',
        description: '',
        color: '#3B82F6',
        permissions: {
            dashboard: { view: true, edit: false, delete: false },
            leads: { view: true, edit: true, delete: false },
            contacts: { view: true, edit: true, delete: false },
            calls: { view: true, edit: true, delete: false },
            reports: { view: true, edit: true, delete: false },
            settings: { view: false, edit: false, delete: false }
        }
    });
    const roleColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'];

    // Initialize with default roles if not loaded from backend yet
    const [userRoles, setUserRoles] = useState({
        admin: { name: 'Administrator', permissions: [], color: '#EF4444', isSuperAdminRole: false },
        manager: { name: 'Manager', permissions: [], color: '#F59E0B', isSuperAdminRole: false },
        agent: { name: 'Sales Agent', permissions: [], color: '#10B981', isSuperAdminRole: false },
        viewer: { name: 'Viewer', permissions: [], color: '#6B7280', isSuperAdminRole: false }
    });

    const [userPermissions, setUserPermissions] = useState({
        dashboard: { view: true, edit: false, delete: false },
        leads: { view: true, edit: true, delete: false },
        contacts: { view: true, edit: true, delete: false },
        calls: { view: true, edit: true, delete: false },
        reports: { view: true, edit: true, delete: false },
        settings: { view: false, edit: false, delete: false }
    });

    const [userManagement, setUserManagement] = useState({
        allowSelfRegistration: false,
        requireEmailVerification: true,
        passwordResetEnabled: true,
        selfPasswordChange: true,
        passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumbers: true,
            requireUppercase: true
        },
        sessionTimeout: 60,
        maxFailedAttempts: 5,
        lockoutDuration: 30
    });

    const [newUser, setNewUser] = useState({
        name: '',
        email: '',
        role: 'agent',
        phone: '',
        department: '',
        status: 'active'
    });

    useEffect(() => {
        loadSettings();
        loadUsers();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (openDropdownId && !event.target.closest('.dept-dropdown')) {
                setOpenDropdownId(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [openDropdownId]);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const data = await getSettings('usermanagement');
            setUserManagement({ ...userManagement, ...data.userManagement });
            setUserPermissions(data.userPermissions || userPermissions);
            if (data.userRoles) {
                setUserRoles(prev => ({ ...prev, ...data.userRoles }));
            }
        } catch (err) {
            showToast('Failed to load user management configurations', 'error'); // Fallback if api.js doesn't catch
            notify.error('Failed to load user management configurations');
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const usersData = await getUsers();
            setUsers(usersData || []);
        } catch (err) {
            showToast('Failed to load users', 'error');
            notify.error('Failed to load users');
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await saveSettings('usermanagement', {
                userManagement,
                userPermissions
            });
            notify.success('User management settings updated!');
        } catch (err) {
            notify.error('Failed to save user management settings');
        } finally {
            setSaving(false);
        }
    };

    // Close modals on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setShowAddUserModal(false);
                setShowEditUserModal(false);
                setShowRestrictModal(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // Handle modal overlay click
    const handleOverlayClick = (e, closeHandler) => {
        if (e.target === e.currentTarget) {
            closeHandler();
        }
    };

    // --- New Action Handlers ---

    const handleAddUser = async () => {
        if (!newUserData.name || !newUserData.email || !newUserData.password) {
            setModalError('Name, email, and password are required');
            return;
        }
        setModalLoading(true);
        setModalError(null);
        try {
            await createUser(newUserData);
            setShowAddUserModal(false);
            setNewUserData({ name: '', email: '', password: '', role: 'Telecaller', phone: '', department: '', status: 'Active', isSuperAdminManaged: false, requirePasswordReset: false, authMethod: 'Password' });
            loadUsers(); // Refresh list
            loadUsers(); // Refresh list
            notify.success('User created successfully');
        } catch (error) {
            setModalError(error.message || 'Failed to create user');
        } finally {
            setModalLoading(false);
        }
    };

    const handleOpenEditModal = (u) => {
        setSelectedUserForAction(u);
        setEditUserData({
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'Telecaller',
            phone: u.phone || '',
            department: u.department || '',
            status: u.status || 'Active',
            isSuperAdminManaged: u.isSuperAdminManaged || false,
            requirePasswordReset: u.requirePasswordReset || false,
            authMethod: u.authMethod || 'Password'
        });
        setModalError(null);
        setShowEditUserModal(true);
    };

    const handleSaveEditUser = async () => {
        if (!editUserData.name) {
            setModalError('Name is required');
            return;
        }
        setModalLoading(true);
        setModalError(null);
        try {
            await updateUser(selectedUserForAction.id || selectedUserForAction._id, {
                name: editUserData.name,
                email: editUserData.email,
                role: editUserData.role,
                phone: editUserData.phone,
                department: editUserData.department,
                status: editUserData.status,
                isSuperAdminManaged: editUserData.isSuperAdminManaged,
                requirePasswordReset: editUserData.requirePasswordReset,
                authMethod: editUserData.authMethod
            });
            setShowEditUserModal(false);
            setSelectedUserForAction(null);
            loadUsers();
            loadUsers();
            notify.success('User updated successfully');
        } catch (error) {
            setModalError(error.message || 'Failed to update user');
        } finally {
            setModalLoading(false);
        }
    };

    const handleDeleteUser = (userId) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: async () => {
                try {
                    await deleteUser(userId);
                    loadUsers();
                    notify.success('User deleted successfully');
                } catch (error) {
                    notify.error('Failed to delete user: ' + (error.message || 'Unknown error'));
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleToggleStatus = async (userId) => {
        try {
            await toggleUserStatus(userId);
            loadUsers();
            notify.success('User status updated');
        } catch (error) {
            notify.error('Failed to update status');
        }
    };

    const handleDeleteDepartment = (deptId, deptName) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Department',
            message: `Are you sure you want to delete "${deptName}" ? This action cannot be undone.`,
            type: 'danger',
            confirmText: 'Delete',
            onConfirm: () => {
                setDepartments(departments.filter(d => d.id !== deptId));
                notify.success(`Department "${deptName}" deleted successfully`);
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleToggleDepartment = (deptId, currentStatus) => {
        setDepartments(departments.map(d =>
            d.id === deptId ? { ...d, status: currentStatus === 'Active' ? 'Inactive' : 'Active' } : d
        ));
        notify.success(`Department ${currentStatus === 'Active' ? 'disabled' : 'enabled'} `);
    };

    const handleOpenRestrictModal = (u) => {
        setSelectedUserForAction(u);
        // Map permissions from u (or default) to restrictionData
        // Assuming u.permissions structure matches what we expect or we use defaults
        // Note: The structure might be different from Profile.jsx depending on backend.
        // For now, mapping safely.
        setRestrictionData({
            canMakeCalls: u.permissions?.canMakeCalls ?? true,
            canEditLeads: u.permissions?.canEditLeads ?? true,
            canDeleteLeads: u.permissions?.canDeleteLeads ?? false,
            canViewReports: u.permissions?.canViewReports ?? true,
            canExport: u.permissions?.canExport ?? false
        });
        setModalError(null);
        setShowRestrictModal(true);
    };

    const handleSaveRestrictions = async () => {
        setModalLoading(true);
        setModalError(null);
        try {
            await updateUserPermissions(selectedUserForAction.id || selectedUserForAction._id, restrictionData);
            setShowRestrictModal(false);
            setSelectedUserForAction(null);
            loadUsers();
            loadUsers();
            notify.success('Permissions updated successfully');
        } catch (error) {
            setModalError(error.message || 'Failed to update permissions');
        } finally {
            setModalLoading(false);
        }
    };

    const handlePasswordReset = (user) => {
        setConfirmation({
            isOpen: true,
            title: 'Reset Password',
            message: `Send password reset instructions to ${user.email}?`,
            type: 'info',
            confirmText: 'Send Email',
            onConfirm: async () => {
                try {
                    await sendOTP(user.email);
                    notify.success('Password reset instructions sent!');
                } catch (err) {
                    notify.error('Failed to send reset instructions');
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleAddRole = async () => {
        if (!newRoleData.name) {
            setModalError('Role name is required');
            return;
        }

        const roleKey = newRoleData.name.toLowerCase().replace(/[^a-z0-9]/g, '');

        if (userRoles[roleKey]) {
            setModalError('Role with this name already exists');
            return;
        }

        const newRole = {
            name: newRoleData.name,
            permissions: newRoleData.permissions,
            color: newRoleData.color,
            description: newRoleData.description,
            isSuperAdminRole: newRoleData.isSuperAdminRole || false
        };

        const updatedRoles = { ...userRoles, [roleKey]: newRole };

        setModalLoading(true); // Re-using modalLoading for this too
        try {
            // Save to backend
            await saveSettings('usermanagement', {
                userManagement,
                userPermissions,
                userRoles: updatedRoles
            });

            // Update local state
            setUserRoles(updatedRoles);
            setShowAddRoleModal(false);
            setNewRoleData({
                name: '',
                description: '',
                color: '#3B82F6',
                permissions: userPermissions, // Reset with current defaults 
                isSuperAdminRole: false
            });
            notify.success('Role created and saved successfully');
        } catch (error) {
            setModalError('Failed to save role: ' + error.message);
        } finally {
            setModalLoading(false);
        }
    };

    const getRoleColor = (role) => {
        return userRoles[role]?.color || '#6B7280';
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <span className="ml-3 font-medium">Loading user configurations...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
                confirmText={confirmation.confirmText}
            />

            {/* Input Modal */}
            <InputModal
                isOpen={inputModal.isOpen}
                onClose={() => setInputModal(prev => ({ ...prev, isOpen: false }))}
                onSubmit={inputModal.onSubmit}
                title={inputModal.title}
                message={inputModal.message}
                initialValue={inputModal.initialValue}
                placeholder="Enter value..."
            />

            {/* User Role Management */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-user-star-line"
                    title="User Role Management"
                    subtitle="Configure access levels and permissions for different user roles"
                    action={
                        <button
                            onClick={() => setShowAddRoleModal(true)}
                            style={{
                                padding: '0.625rem 1.25rem',
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                        >
                            <i className="ri-add-line"></i> Add New Role
                        </button>
                    }
                />

                <div style={{ padding: '1.5rem', background: 'var(--bg-main)' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                        gap: '1.5rem'
                    }}>
                        {Object.entries(userRoles).map(([key, role]) => (
                            <div
                                key={key}
                                className="group relative rounded-2xl transition-all duration-300"
                                style={{
                                    background: `linear-gradient(135deg, ${role.color}08 0%, var(--bg-card) 100%)`,
                                    border: `2px solid ${role.color}`,
                                    overflow: 'hidden',
                                    borderRadius: '1rem'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = `0 10px 30px ${role.color}60`;
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                {/* Card content */}
                                <div style={{ padding: '1.5rem' }}>
                                    {/* Icon and Title */}
                                    <div className="flex items-center gap-4 mb-4">
                                        <div
                                            className="relative flex items-center group-hover:scale-110 group-hover:rotate-6"
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '16px',
                                                background: `linear-gradient(135deg, ${role.color} 0%, ${role.color}dd 100%)`,
                                                boxShadow: `0 6px 16px ${role.color}70, inset 0 -2px 8px rgba(0, 0, 0, 0.2)`,
                                                justifyContent: 'center',
                                                color: 'white',
                                                fontSize: '1.5rem',
                                                fontWeight: 'bold',
                                                transition: 'all 0.3s ease-in-out',
                                            }}
                                        >
                                            {role.name.charAt(0)}
                                            {/* Shine effect */}
                                            <div style={{
                                                position: 'absolute',
                                                top: '6px',
                                                left: '6px',
                                                right: '6px',
                                                height: '45%',
                                                background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, transparent 100%)',
                                                borderRadius: '12px 12px 24px 24px',
                                                pointerEvents: 'none'
                                            }}></div>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-lg mb-1" style={{ color: role.color }}>
                                                {role.name}
                                            </h4>
                                            <div style={{
                                                fontSize: '0.7rem',
                                                color: '#9ca3af',
                                                fontWeight: '600',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.8px'
                                            }}>
                                                ROLE TYPE
                                            </div>
                                        </div>

                                        {role.isSuperAdminRole && (
                                            <div className="absolute top-4 right-4" title="Visible only to Super Admin">
                                                <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded-full font-bold border border-purple-200">
                                                    SUPER ADMIN
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Description */}
                                    <p className="leading-relaxed mb-5" style={{ color: '#4b5563', minHeight: '44px', fontWeight: '500', fontSize: '0.8rem', margin: '1rem 0 0' }}>
                                        {key === 'admin' && 'Full system access with all privileges'}
                                        {key === 'manager' && 'Moderate access with team management'}
                                        {key === 'agent' && 'Basic access for lead management'}
                                        {key === 'viewer' && 'Limited access read-only permissions'}
                                    </p>

                                    {/* Configure Button */}
                                    {hasPermission(PERMISSIONS.MANAGE_USERS) && (
                                        <button
                                            className="w-full btn transition-all duration-200"
                                            style={{
                                                background: role.color,
                                                color: 'white',
                                                border: 'none',
                                                fontWeight: '700',
                                                padding: '0.75rem 1.25rem',
                                                borderRadius: '12px',
                                                fontSize: '0.875rem',
                                                boxShadow: `0 4px 12px ${role.color}50`,
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = `linear-gradient(135deg, ${role.color} 0%, ${role.color}cc 100%)`;
                                                e.currentTarget.style.boxShadow = `0 6px 16px ${role.color}70`;
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = role.color;
                                                e.currentTarget.style.boxShadow = `0 4px 12px ${role.color}50`;
                                                e.currentTarget.style.transform = 'translateY(0)';
                                            }}
                                            onClick={() => setConfiguringRole(key)}
                                        >
                                            <i className="ri-settings-3-line mr-2"></i> Configure Role
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}


                    </div>
                </div>
            </div>

            {/* Role Configuration Modal */}
            {configuringRole && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0, 0, 0, 0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 10000,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '1.5rem',
                        width: '90%',
                        maxWidth: '700px',
                        maxHeight: '85vh',
                        overflow: 'hidden',
                        boxShadow: `0 20px 60px ${userRoles[configuringRole].color}40`
                    }}>
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            background: `linear-gradient(135deg, ${userRoles[configuringRole].color} 0%, ${userRoles[configuringRole].color}dd 100%)`,
                            color: 'white',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '1.5rem',
                                    fontWeight: '700'
                                }}>
                                    {userRoles[configuringRole].name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>
                                        Configure {userRoles[configuringRole].name}
                                    </h3>
                                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.875rem' }}>
                                        Set permissions for this role
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setConfiguringRole(null)}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    border: 'none',
                                    borderRadius: '10px',
                                    width: '40px',
                                    height: '40px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    color: 'white',
                                    fontSize: '1.25rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                <i className="ri-close-line"></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '2rem', maxHeight: 'calc(85vh - 180px)', overflowY: 'auto' }}>
                            <div style={{ marginBottom: '1.5rem' }}>
                                <h4 style={{
                                    fontSize: '1rem',
                                    fontWeight: '700',
                                    marginBottom: '0.75rem',
                                    color: userRoles[configuringRole].color,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    Module Permissions
                                </h4>
                                <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: 0 }}>
                                    Configure what this role can view, edit, and delete across different modules
                                </p>
                            </div>

                            {/* Permissions Table */}
                            <div style={{
                                border: `2px solid ${userRoles[configuringRole].color} 20`,
                                borderRadius: '12px',
                                overflow: 'hidden'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{
                                            background: `${userRoles[configuringRole].color} 15`,
                                            borderBottom: `2px solid ${userRoles[configuringRole].color} 30`
                                        }}>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'left',
                                                fontWeight: '700',
                                                color: userRoles[configuringRole].color,
                                                fontSize: '0.875rem',
                                                textTransform: 'uppercase',
                                                letterSpacing: '0.5px'
                                            }}>Module</th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '700',
                                                color: userRoles[configuringRole].color,
                                                fontSize: '0.875rem'
                                            }}>View</th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '700',
                                                color: userRoles[configuringRole].color,
                                                fontSize: '0.875rem'
                                            }}>Edit</th>
                                            <th style={{
                                                padding: '1rem',
                                                textAlign: 'center',
                                                fontWeight: '700',
                                                color: userRoles[configuringRole].color,
                                                fontSize: '0.875rem'
                                            }}>Delete</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(userPermissions).map(([module, permissions], index) => (
                                            <tr key={module} style={{
                                                borderBottom: index < Object.keys(userPermissions).length - 1 ? `1px solid ${userRoles[configuringRole].color} 10` : 'none',
                                                transition: 'background 0.2s'
                                            }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = `${userRoles[configuringRole].color}05`}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <td style={{
                                                    padding: '1rem',
                                                    fontWeight: '600',
                                                    color: '#374151',
                                                    textTransform: 'capitalize',
                                                    fontSize: '0.9375rem'
                                                }}>
                                                    <i className={`ri - ${module === 'dashboard' ? 'dashboard' : module === 'leads' ? 'user-star' : module === 'contacts' ? 'contacts' : module === 'calls' ? 'phone' : module === 'reports' ? 'file-chart' : 'settings'} -line mr - 2`}
                                                        style={{ color: userRoles[configuringRole].color }}></i>
                                                    {module}
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <label className="switch switch-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions.view}
                                                            onChange={(e) => setUserPermissions({
                                                                ...userPermissions,
                                                                [module]: { ...permissions, view: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <label className="switch switch-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions.edit}
                                                            onChange={(e) => setUserPermissions({
                                                                ...userPermissions,
                                                                [module]: { ...permissions, edit: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <label className="switch switch-sm">
                                                        <input
                                                            type="checkbox"
                                                            checked={permissions.delete}
                                                            onChange={(e) => setUserPermissions({
                                                                ...userPermissions,
                                                                [module]: { ...permissions, delete: e.target.checked }
                                                            })}
                                                        />
                                                        <span className="slider"></span>
                                                    </label>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1.25rem 2rem',
                            background: 'var(--bg-main)',
                            borderTop: '1px solid #e5e7eb',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem'
                        }}>
                            <button
                                onClick={() => setConfiguringRole(null)}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    border: '2px solid #e5e7eb',
                                    background: 'var(--bg-card)',
                                    color: '#6b7280',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.background = '#f9fafb';
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.background = 'white';
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    handleSave();
                                    setConfiguringRole(null);
                                }}
                                style={{
                                    padding: '0.75rem 1.5rem',
                                    borderRadius: '10px',
                                    border: 'none',
                                    background: userRoles[configuringRole].color,
                                    color: 'white',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    fontSize: '0.875rem',
                                    boxShadow: `0 4px 12px ${userRoles[configuringRole].color} 40`,
                                    transition: 'all 0.2s',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = `0 6px 16px ${userRoles[configuringRole].color} 60`;
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = `0 4px 12px ${userRoles[configuringRole].color} 40`;
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <i className="ri-save-line mr-2"></i> Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Management Section */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', marginBottom: '1.5rem' }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: 'var(--primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>Department Management</h3>
                        <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem' }}>
                            Configure departments for user assignment
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setInputModal({
                                isOpen: true,
                                title: 'Add Department',
                                message: 'Enter the name for the new department',
                                initialValue: '',
                                onSubmit: (value) => {
                                    setDepartments([...departments, {
                                        id: Date.now(),
                                        name: value,
                                        status: 'Active'
                                    }]);
                                    setInputModal(prev => ({ ...prev, isOpen: false }));
                                }
                            });
                        }}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <i className="ri-add-line"></i> Add Department
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))' }}>
                        {departments.map((dept) => (
                            <div
                                key={dept.id}
                                style={{
                                    padding: '0.75rem',
                                    borderRadius: '0.75rem',
                                    border: dept.status === 'Active' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                    background: dept.status === 'Active' ? 'var(--primary-light)' : 'var(--card-bg)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '0.75rem',
                                    transition: 'all 0.2s',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px var(--primary-shadow)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                {/* Toggle in top-right corner */}
                                <label style={{
                                    position: 'absolute',
                                    top: '0.75rem',
                                    right: '0.75rem',
                                    display: 'inline-block',
                                    width: '36px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    zIndex: 1
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={dept.status === 'Active'}
                                        onChange={() => handleToggleDepartment(dept.id, dept.status)}
                                        style={{ opacity: 0, width: 0, height: 0 }}
                                    />
                                    <span style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        backgroundColor: dept.status === 'Active' ? 'var(--primary)' : '#d1d5db',
                                        borderRadius: '20px',
                                        transition: 'background-color 0.2s',
                                        cursor: 'pointer'
                                    }}>
                                        <span style={{
                                            position: 'absolute',
                                            content: '',
                                            height: '14px',
                                            width: '14px',
                                            left: dept.status === 'Active' ? '19px' : '3px',
                                            bottom: '3px',
                                            backgroundColor: 'white',
                                            borderRadius: '50%',
                                            transition: 'left 0.2s',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                        }}></span>
                                    </span>
                                </label>

                                {/* Department info section */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingRight: '3rem' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '0.5rem',
                                        background: dept.status === 'Active' ? 'var(--primary)' : '#9ca3af',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: 'bold',
                                        fontSize: '1.125rem',
                                        flexShrink: 0
                                    }}>
                                        <i className="ri-building-line"></i>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontWeight: '600', fontSize: '0.9375rem', color: dept.status === 'Active' ? '#06b6d4' : '#6b7280' }}>
                                            {dept.name}
                                        </h4>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: dept.status === 'Active' ? 'var(--primary)' : '#ef4444',
                                            fontWeight: '600'
                                        }}>
                                            {dept.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Action icons at bottom */}
                                <div style={{
                                    display: 'flex',
                                    gap: '0.5rem',
                                    justifyContent: 'flex-end',
                                    paddingTop: '0.5rem',
                                    borderTop: '1px solid var(--border)'
                                }}>
                                    {/* Edit Icon Button */}
                                    <button
                                        onClick={() => {
                                            setInputModal({
                                                isOpen: true,
                                                title: 'Edit Department',
                                                message: 'Enter the new name for this department',
                                                initialValue: dept.name,
                                                onSubmit: (value) => {
                                                    setDepartments(departments.map(d =>
                                                        d.id === dept.id ? { ...d, name: value } : d
                                                    ));
                                                    setInputModal(prev => ({ ...prev, isOpen: false }));
                                                }
                                            });
                                        }}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border)',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s',
                                            padding: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = 'var(--primary-light)';
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                            e.currentTarget.style.color = 'var(--primary)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                        title="Edit Department"
                                    >
                                        <i className="ri-edit-line" style={{ fontSize: '1rem' }}></i>
                                    </button>

                                    {/* Delete Icon Button */}
                                    <button
                                        onClick={() => handleDeleteDepartment(dept.id, dept.name)}
                                        style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '0.375rem',
                                            border: '1px solid var(--border)',
                                            background: 'transparent',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--text-secondary)',
                                            transition: 'all 0.2s',
                                            padding: 0
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#fef2f2';
                                            e.currentTarget.style.borderColor = '#ef4444';
                                            e.currentTarget.style.color = '#ef4444';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = 'transparent';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                            e.currentTarget.style.color = 'var(--text-secondary)';
                                        }}
                                        title="Delete Department"
                                    >
                                        <i className="ri-delete-bin-line" style={{ fontSize: '1rem' }}></i>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{
                        marginTop: '1rem',
                        padding: '0.75rem',
                        background: '#fef3c7',
                        borderRadius: '0.5rem',
                        border: '1px solid #fde68a',
                        fontSize: '0.875rem',
                        color: '#92400e'
                    }}>
                        <i className="ri-information-line" style={{ marginRight: '0.5rem' }}></i>
                        Inactive departments won't appear in dropdowns but existing assignments remain unchanged.
                    </div>
                </div>
            </div>

            {/* All Users Section */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <div style={{
                    padding: '1.25rem 1.5rem',
                    background: '#10B981',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 0,
                    borderRadius: '1rem 1rem 0 0'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-user-line" style={{ fontSize: '22px', color: 'white' }}></i>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>All Users</h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem' }}>Manage all users in your system</p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {hasPermission(PERMISSIONS.MANAGE_USERS) && (
                            <button
                                className="btn"
                                style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    border: 'none'
                                }}
                                onClick={() => setShowAddUserModal(true)}
                            >
                                <i className="ri-add-line mr-1"></i> Add User
                            </button>
                        )}
                        <div style={{
                            display: 'flex',
                            gap: '0.25rem',
                            background: 'rgba(255, 255, 255, 0.25)',
                            padding: '0.25rem',
                            borderRadius: '0.5rem'
                        }}>
                            <button
                                onClick={() => setViewMode('table')}
                                style={{
                                    padding: '0.5rem 0.625rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    background: viewMode === 'table' ? 'white' : 'transparent',
                                    color: viewMode === 'table' ? '#10B981' : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    boxShadow: viewMode === 'table' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                                title="Table View"
                            >
                                <i className="ri-list-check-2"></i>
                            </button>
                            <button
                                onClick={() => setViewMode('card')}
                                style={{
                                    padding: '0.5rem 0.625rem',
                                    borderRadius: '0.375rem',
                                    border: 'none',
                                    background: viewMode === 'card' ? 'white' : 'transparent',
                                    color: viewMode === 'card' ? '#10B981' : 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontWeight: '600',
                                    fontSize: '0.875rem',
                                    boxShadow: viewMode === 'card' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                }}
                                title="Card View"
                            >
                                <i className="ri-grid-fill"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '1.5rem' }}>


                    {/* User Table View */}
                    {viewMode === 'table' && (
                        <div style={{
                            background: 'var(--bg-card)',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                            overflow: 'hidden'
                        }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                    <thead style={{ borderLeft: `4px solid var(--primary)` }}>
                                        <tr style={{
                                            background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 85%, white) 0%, color-mix(in srgb, var(--primary) 70%, white) 100%)',
                                            color: '#1f2937'
                                        }}>
                                            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>User</th>
                                            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                                            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Email</th>
                                            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</th>
                                            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                            <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.map((user, index) => (
                                            <tr
                                                key={user.id}
                                                style={{
                                                    borderBottom: '1px solid #f3f4f6',
                                                    background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                                                    transition: 'background 0.15s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)'}
                                            >
                                                <td style={{ padding: '1rem', borderLeft: `4px solid ${getRoleColor(user.role)} ` }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                        <div style={{
                                                            width: '40px',
                                                            height: '40px',
                                                            borderRadius: '10px',
                                                            background: getRoleColor(user.role),
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'white',
                                                            fontWeight: '700',
                                                            fontSize: '1rem',
                                                            boxShadow: `0 3px 8px ${getRoleColor(user.role)} 40`
                                                        }}>
                                                            {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{user.name}</div>
                                                            <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>{user.phone || 'No phone'}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: '500', color: '#374151', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: `${getRoleColor(user.role)} 20`,
                                                        color: getRoleColor(user.role)
                                                    }}>
                                                        {userRoles[user.role]?.name || 'Unknown Role'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', fontWeight: '500', color: '#6b7280', fontSize: '0.8rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <i className="ri-mail-line" style={{ color: '#9ca3af' }}></i>
                                                        {user.email}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', color: '#6b7280', fontSize: '0.8rem', fontWeight: '500' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <i className="ri-building-line" style={{ color: '#9ca3af' }}></i>
                                                        {user.department || 'N/A'}
                                                    </div>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '0.25rem 0.625rem',
                                                        borderRadius: '6px',
                                                        fontSize: '0.75rem',
                                                        fontWeight: '600',
                                                        background: user.status === 'active' ? '#d1fae5' :
                                                            user.status === 'inactive' ? '#e5e7eb' : '#fef3c7',
                                                        color: user.status === 'active' ? '#047857' :
                                                            user.status === 'inactive' ? '#4b5563' : '#92400e'
                                                    }}>
                                                        {user.status}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                        {hasPermission(PERMISSIONS.MANAGE_USERS) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenRestrictModal(user)}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: 'var(--bg-hover)',
                                                                        color: '#7e22ce',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'transform 0.15s'
                                                                    }}
                                                                    title="Access Restrictions"
                                                                >
                                                                    <i className="ri-shield-keyhole-line"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenEditModal(user)}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: 'var(--bg-hover)',
                                                                        color: '#2563eb',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'transform 0.15s'
                                                                    }}
                                                                    title="Edit User"
                                                                >
                                                                    <i className="ri-edit-line"></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleToggleStatus(user.id || user._id)}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: user.status === 'Suspended' ? 'var(--bg-hover)' : 'var(--bg-hover)',
                                                                        color: user.status === 'Suspended' ? '#16a34a' : '#6b7280',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'transform 0.15s'
                                                                    }}
                                                                    title={user.status === 'Suspended' ? 'Activate User' : 'Suspend User'}
                                                                >
                                                                    <i className={user.status === 'Suspended' ? "ri-user-follow-line" : "ri-user-forbid-line"}></i>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteUser(user.id || user._id)}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: 'var(--bg-hover)',
                                                                        color: '#dc2626',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        transition: 'transform 0.15s'
                                                                    }}
                                                                    title="Delete User"
                                                                >
                                                                    <i className="ri-delete-bin-line"></i>
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* User Card View */}
                    {viewMode === 'card' && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
                            {users.map(user => {
                                const roleColor = getRoleColor(user.role);
                                return (
                                    <div
                                        key={user.id}
                                        style={{
                                            background: 'var(--bg-card)',
                                            borderRadius: '1rem',
                                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                                            overflow: 'hidden',
                                            borderLeft: `4px solid ${roleColor} `,
                                            transition: 'transform 0.2s, box-shadow 0.2s'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-4px)';
                                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.12)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.08)';
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div style={{
                                            padding: '1rem 1.25rem',
                                            background: `linear - gradient(135deg, ${roleColor}15 0 %, transparent 100 %)`,
                                            borderBottom: '1px solid #f3f4f6',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <div style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    borderRadius: '12px',
                                                    background: roleColor,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'white',
                                                    fontWeight: '700',
                                                    fontSize: '1.125rem',
                                                    boxShadow: `0 4px 12px ${roleColor} 40`
                                                }}>
                                                    {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                </div>
                                                <div>
                                                    <h3 style={{
                                                        fontWeight: '700',
                                                        color: '#1f2937',
                                                        fontSize: '1rem',
                                                        marginBottom: '2px'
                                                    }}>
                                                        {user.name}
                                                    </h3>
                                                    <span style={{
                                                        fontSize: '0.75rem',
                                                        color: '#6b7280'
                                                    }}>
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </div>
                                            <span style={{
                                                padding: '0.25rem 0.625rem',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: '600',
                                                background: user.status === 'active' ? '#d1fae5' :
                                                    user.status === 'inactive' ? '#e5e7eb' : '#fef3c7',
                                                color: user.status === 'active' ? '#047857' :
                                                    user.status === 'inactive' ? '#4b5563' : '#92400e'
                                            }}>
                                                {user.status}
                                            </span>
                                        </div>

                                        {/* Card Body */}
                                        <div style={{ padding: '1rem 1.25rem' }}>
                                            {/* Contact Info */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '6px',
                                                        background: 'var(--bg-hover)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#16a34a'
                                                    }}>
                                                        <i className="ri-user-fill" style={{ fontSize: '0.875rem' }}></i>
                                                    </div>
                                                    <span style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                                                        {userRoles[user.role]?.name || 'Unknown Role'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '6px',
                                                        background: 'var(--bg-hover)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#2563eb'
                                                    }}>
                                                        <i className="ri-phone-fill" style={{ fontSize: '0.875rem' }}></i>
                                                    </div>
                                                    <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                                        {user.phone || 'N/A'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', flexWrap: 'wrap' }}>
                                                    <div style={{
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '6px',
                                                        background: 'var(--bg-hover)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        color: '#7e22ce'
                                                    }}>
                                                        <i className="ri-building-line" style={{ fontSize: '0.875rem' }}></i>
                                                    </div>
                                                    <span style={{ color: '#6b7280', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                                        {user.department || 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div style={{
                                            padding: '0.875rem 1.25rem',
                                            background: 'var(--bg-main)',
                                            borderTop: '1px solid #f3f4f6',
                                            display: 'flex',
                                            justifyContent: 'flex-end',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}>
                                            <div className="flex justify-end gap-2 w-full">
                                                {user.isSuperAdminManaged && !isSuperAdmin ? (
                                                    <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2 py-1 rounded flex items-center gap-1">
                                                        <i className="ri-shield-keyhole-line"></i> Protected
                                                    </span>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenRestrictModal(user)}
                                                            className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                            title="Access Restrictions"
                                                        >
                                                            <i className="ri-shield-keyhole-line text-lg"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handlePasswordReset(user)}
                                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Reset Password"
                                                        >
                                                            <i className="ri-key-2-line text-lg"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleOpenEditModal(user)}
                                                            className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                                            title="Edit User"
                                                        >
                                                            <i className="ri-edit-line text-lg"></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleToggleStatus(user._id || user.id)}
                                                            className={`p - 2 rounded - lg transition - colors ${user.status === 'Active' ? 'text-orange-500 hover:text-orange-600 hover:bg-orange-50' : 'text-green-500 hover:text-green-600 hover:bg-green-50'} `}
                                                            title={user.status === 'Active' ? 'Suspend User' : 'Activate User'}
                                                        >
                                                            <i className={user.status === 'Active' ? 'ri-pause-circle-line text-lg' : 'ri-play-circle-line text-lg'}></i>
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteUser(user._id || user.id)}
                                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete User"
                                                        >
                                                            <i className="ri-delete-bin-line text-lg"></i>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                    }
                </div>
            </div>

            {/* Permission Matrix */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-shield-keyhole-line"
                    title="Permission Matrix"
                    subtitle="Assign granular permissions for different modules"
                    color="#10B981"
                />

                <div style={{ padding: '1.5rem' }}>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 font-semibold">Module</th>
                                    <th className="text-center py-3 px-4 font-semibold">View</th>
                                    <th className="text-center py-3 px-4 font-semibold">Edit</th>
                                    <th className="text-center py-3 px-4 font-semibold">Delete</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.entries(userPermissions).map(([module, permissions]) => (
                                    <tr key={module} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 font-medium capitalize">{module.charAt(0).toUpperCase() + module.slice(1)}</td>
                                        <td className="py-3 px-4" style={{ textAlign: 'center' }}>
                                            <label className="switch switch-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.view}
                                                    onChange={(e) => setUserPermissions({
                                                        ...userPermissions,
                                                        [module]: { ...permissions, view: e.target.checked }
                                                    })}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </td>
                                        <td className="py-3 px-4" style={{ textAlign: 'center' }}>
                                            <label className="switch switch-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.edit}
                                                    onChange={(e) => setUserPermissions({
                                                        ...userPermissions,
                                                        [module]: { ...permissions, edit: e.target.checked }
                                                    })}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </td>
                                        <td className="py-3 px-4" style={{ textAlign: 'center' }}>
                                            <label className="switch switch-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.delete}
                                                    onChange={(e) => setUserPermissions({
                                                        ...userPermissions,
                                                        [module]: { ...permissions, delete: e.target.checked }
                                                    })}
                                                />
                                                <span className="slider"></span>
                                            </label>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Self Registration & Password Settings */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-shield-user-line"
                    title="Self Registration & Password Settings"
                    subtitle="Configure self-registration and password policies"
                    color="#8B5CF6"
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <div className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                            <div>
                                <h4 className="font-bold text-sm text-indigo-800">Self Registration</h4>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Allow users to register themselves.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={userManagement.allowSelfRegistration}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        allowSelfRegistration: e.target.checked
                                    })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div>
                                <h4 className="font-bold text-sm text-blue-800">Email Verification</h4>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Require email OTP verification for new users.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={userManagement.requireEmailVerification}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        requireEmailVerification: e.target.checked
                                    })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                            <div>
                                <h4 className="font-bold text-sm text-purple-800">Password Reset</h4>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Allow users to reset their own passwords.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={userManagement.passwordResetEnabled}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        passwordResetEnabled: e.target.checked
                                    })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg border border-green-100">
                            <div>
                                <h4 className="font-bold text-sm text-green-800">Self Password Change</h4>
                                <p style={{ color: '#6b7280', fontSize: '0.8rem' }}>Allow users to change their own passwords.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={userManagement.selfPasswordChange}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        selfPasswordChange: e.target.checked
                                    })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Registration Settings */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-user-add-line"
                    title="User Registration"
                    subtitle="Configure registration settings and security policies"
                    color="#F59E0B"
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                            <div>
                                <h4 className="font-bold text-sm text-yellow-800">Self Registration</h4>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Allow users to register themselves.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={userManagement.allowSelfRegistration}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        allowSelfRegistration: e.target.checked
                                    })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <div className="flex justify-between items-center bg-blue-50 p-3 rounded-lg border border-blue-100">
                            <div>
                                <h4 className="font-bold text-sm text-blue-800">Email Verification</h4>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Require email verification for new users.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={userManagement.requireEmailVerification}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        requireEmailVerification: e.target.checked
                                    })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Session Timeout (minutes)</label>
                        <input
                            type="number"
                            value={userManagement.sessionTimeout}
                            onChange={(e) => setUserManagement({
                                ...userManagement,
                                sessionTimeout: parseInt(e.target.value)
                            })}
                            placeholder="Session timeout in minutes"
                            min="10"
                            max="120"
                        />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Max Failed Login Attempts</label>
                        <input
                            type="number"
                            value={userManagement.maxFailedAttempts}
                            onChange={(e) => setUserManagement({
                                ...userManagement,
                                maxFailedAttempts: parseInt(e.target.value)
                            })}
                            placeholder="Max failed attempts before lockout"
                            min="1"
                            max="10"
                        />
                    </div>
                </div>
            </div>

            {/* Password Policy Settings */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-lock-password-line"
                    title="Password Policy"
                    subtitle="Define security requirements for user passwords"
                    color="#EF4444"
                />

                <div style={{ padding: '1.5rem' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Length</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="range"
                                    min="6"
                                    max="20"
                                    value={userManagement.passwordPolicy.minLength || 8}
                                    onChange={(e) => setUserManagement({
                                        ...userManagement,
                                        passwordPolicy: {
                                            ...userManagement.passwordPolicy,
                                            minLength: parseInt(e.target.value)
                                        }
                                    })}
                                    className="flex-1"
                                    style={{
                                        background: `linear - gradient(to right, var(--primary) ${(((userManagement.passwordPolicy.minLength || 8) - 6) * 100 / (20 - 6))}%, #e5e7eb ${(((userManagement.passwordPolicy.minLength || 8) - 6) * 100 / (20 - 6))}%)`
                                    }}
                                />
                                <span className="text-sm font-medium w-10 text-center">
                                    {userManagement.passwordPolicy.minLength || 8}
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                                <div>
                                    <h4 className="font-bold text-sm text-red-800">Special Characters</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Require at least one special character.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={userManagement.passwordPolicy.requireSpecialChar}
                                        onChange={(e) => setUserManagement({
                                            ...userManagement,
                                            passwordPolicy: {
                                                ...userManagement.passwordPolicy,
                                                requireSpecialChar: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                                <div>
                                    <h4 className="font-bold text-sm text-red-800">Numbers</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Require at least one number.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={userManagement.passwordPolicy.requireNumbers}
                                        onChange={(e) => setUserManagement({
                                            ...userManagement,
                                            passwordPolicy: {
                                                ...userManagement.passwordPolicy,
                                                requireNumbers: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>

                            <div className="flex justify-between items-center bg-red-50 p-3 rounded-lg border border-red-100">
                                <div>
                                    <h4 className="font-bold text-sm text-red-800">Uppercase</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Require at least one uppercase letter.</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={userManagement.passwordPolicy.requireUppercase}
                                        onChange={(e) => setUserManagement({
                                            ...userManagement,
                                            passwordPolicy: {
                                                ...userManagement.passwordPolicy,
                                                requireUppercase: e.target.checked
                                            }
                                        })}
                                    />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.875rem 3rem' }}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <><i className="ri-loader-4-line spin mr-2"></i> Saving...</>
                    ) : (
                        <><i className="ri-save-line mr-2"></i> Save User Management Settings</>
                    )}
                </button>
            </div>

            {/* --- Modals for User Moderation --- */}

            {/* Add User Modal */}
            {
                showAddUserModal && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => handleOverlayClick(e, () => setShowAddUserModal(false))}
                    >
                        <div className="rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100" style={{ background: 'var(--bg-card)' }}>
                            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-main)' }}>
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Add New User</h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Create a new user account with specific role and access</p>
                                </div>
                                <button
                                    onClick={() => setShowAddUserModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text-secondary)' }}
                                >
                                    <i className="ri-close-line text-xl"></i>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {modalError && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in">
                                        <i className="ri-error-warning-fill text-xl"></i>
                                        <div>
                                            <h4 className="font-semibold text-sm">Error Creating User</h4>
                                            <p className="text-sm opacity-90">{modalError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Full Name <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type="text"
                                                value={newUserData.name}
                                                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                                placeholder="John Doe"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email Address <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type="email"
                                                value={newUserData.email}
                                                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                                placeholder="john@example.com"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Password <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <i className="ri-lock-password-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type={newUserData.password && newUserData.password.length > 0 ? "text" : "password"}
                                                value={newUserData.password}
                                                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                                                className="w-full pl-10 pr-24 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                                placeholder="••••••••"
                                            />
                                            <button
                                                onClick={() => setNewUserData({ ...newUserData, password: generatePassword() })}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                                title="Auto Generate Password"
                                                type="button"
                                            >
                                                Auto Gen
                                            </button>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <i className="ri-shield-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <select
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none bg-white"
                                                value={newUserData.role}
                                                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                                            >
                                                {Object.keys(userRoles).map(roleKey => (
                                                    <option key={roleKey} value={roleKey}>{userRoles[roleKey].name}</option>
                                                ))}
                                            </select>
                                            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </div>
                                    </div>

                                    {/* Security Settings Row */}
                                    <div className="form-group col-span-2">
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '1.5rem',
                                            background: 'var(--bg-main)',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Authentication Method</label>
                                                <div className="flex gap-2">
                                                    {['Password', 'OTP', 'Both'].map(method => (
                                                        <button
                                                            key={method}
                                                            type="button"
                                                            onClick={() => setNewUserData({ ...newUserData, authMethod: method })}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.5rem 0.75rem',
                                                                borderRadius: '0.5rem',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s',
                                                                background: newUserData.authMethod === method ? 'var(--bg-card)' : 'transparent',
                                                                color: newUserData.authMethod === method ? 'var(--primary)' : 'var(--text-secondary)',
                                                                boxShadow: newUserData.authMethod === method ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                                                border: newUserData.authMethod === method ? '1px solid var(--primary)' : '1px solid transparent'
                                                            }}
                                                        >
                                                            {method}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-3">
                                                <div>
                                                    <h4 style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>Force Password Reset</h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Require reset on first login</p>
                                                </div>
                                                <label className="switch switch-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={newUserData.requirePasswordReset}
                                                        onChange={(e) => setNewUserData({ ...newUserData, requirePasswordReset: e.target.checked })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type="tel"
                                                value={newUserData.phone}
                                                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                                placeholder="+1 (555) 000-0000"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                        <div className="relative">
                                            <i className="ri-building-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <select
                                                value={newUserData.department || ''}
                                                onChange={(e) => setNewUserData({ ...newUserData, department: e.target.value })}
                                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none bg-white"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.filter(d => d.status === 'Active').map(dept => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Status</label>
                                        <select
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none bg-white"
                                            value={newUserData.status}
                                            onChange={(e) => setNewUserData({ ...newUserData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Suspended">Suspended</option>
                                        </select>
                                        <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="form-group col-span-2 md:col-span-1">
                                            <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                <div>
                                                    <h4 className="font-bold text-sm text-purple-800">Super Admin Managed</h4>
                                                    <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>Only Super Admin can edit/delete this user.</p>
                                                </div>
                                                <label className="switch switch-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={newUserData.isSuperAdminManaged || false}
                                                        onChange={(e) => setNewUserData({ ...newUserData, isSuperAdminManaged: e.target.checked })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowAddUserModal(false)}
                                    className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddUser}
                                    disabled={modalLoading}
                                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {modalLoading ? (
                                        <><i className="ri-loader-4-line animate-spin"></i> Creating User...</>
                                    ) : (
                                        <><i className="ri-user-add-line"></i> Create User</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                showEditUserModal && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99999] flex items-center justify-center p-4"
                        onClick={(e) => handleOverlayClick(e, () => setShowEditUserModal(false))}
                    >
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Edit User Details</h3>
                                    <p className="text-sm text-gray-500 mt-1">Update profile information for {selectedUserForAction?.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowEditUserModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <i className="ri-close-line text-xl"></i>
                                </button>
                            </div>

                            <div className="p-4 overflow-y-auto custom-scrollbar">
                                {modalError && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in">
                                        <i className="ri-error-warning-fill text-xl"></i>
                                        <div>
                                            <h4 className="font-semibold text-sm">Error Updating User</h4>
                                            <p className="text-sm opacity-90">{modalError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <i className="ri-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type="text"
                                                value={editUserData.name}
                                                onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-gray-400 font-normal">(Read-only)</span></label>
                                        <div className="relative">
                                            <i className="ri-mail-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type="email"
                                                value={editUserData.email}
                                                readOnly
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Role <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <i className="ri-shield-user-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <select
                                                value={editUserData.role}
                                                onChange={(e) => setEditUserData({ ...editUserData, role: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none bg-white"
                                            >
                                                {Object.keys(userRoles).map(roleKey => (
                                                    <option key={roleKey} value={roleKey}>{userRoles[roleKey].name}</option>
                                                ))}
                                            </select>
                                            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number</label>
                                        <div className="relative">
                                            <i className="ri-phone-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input
                                                type="tel"
                                                value={editUserData.phone}
                                                onChange={(e) => setEditUserData({ ...editUserData, phone: e.target.value })}
                                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2 md:col-span-1">
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                                        <div className="relative">
                                            <i className="ri-building-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <select
                                                value={editUserData.department || ''}
                                                onChange={(e) => setEditUserData({ ...editUserData, department: e.target.value })}
                                                className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none appearance-none bg-white"
                                            >
                                                <option value="">Select Department</option>
                                                {departments.filter(d => d.status === 'Active').map(dept => (
                                                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                                                ))}
                                            </select>
                                            <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2">
                                        <label className="block text-sm font-semibold text-gray-700 mb-3">Account Status</label>
                                        <div className="relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all" style={{
                                            borderColor: editUserData.status === 'Active' ? '#10b981' : '#ef4444',
                                            background: editUserData.status === 'Active' ? 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)' : 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)'
                                        }}>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`w - 3 h - 3 rounded - full animate - pulse`} style={{
                                                        background: editUserData.status === 'Active' ? '#10b981' : '#ef4444',
                                                        boxShadow: editUserData.status === 'Active' ? '0 0 8px #10b981' : '0 0 8px #ef4444'
                                                    }}></div>
                                                    <span className="font-bold" style={{ color: editUserData.status === 'Active' ? '#059669' : '#dc2626' }}>
                                                        {editUserData.status === 'Active' ? 'Active' : 'Suspended'}
                                                    </span>
                                                </div>
                                                <p className="text-xs" style={{ color: editUserData.status === 'Active' ? '#047857' : '#991b1b' }}>
                                                    {editUserData.status === 'Active' ? 'User can access the system' : 'User access is suspended'}
                                                </p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={editUserData.status === 'Active'}
                                                    onChange={(e) => setEditUserData({ ...editUserData, status: e.target.checked ? 'Active' : 'Suspended' })}
                                                />
                                                <div className="w-16 h-8 bg-red-400 rounded-full peer peer-checked:after:translate-x-8 peer-checked:after:border-white after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-green-500 shadow-inner"></div>
                                            </label>
                                        </div>
                                    </div>

                                    {/* Security Settings Row for Edit - Moved outside isSuperAdmin block */}
                                    <div className="form-group col-span-2">
                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                            gap: '1.5rem',
                                            background: 'var(--bg-main)',
                                            padding: '1rem',
                                            borderRadius: '0.75rem',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <div>
                                                <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Authentication Method</label>
                                                <div className="flex gap-2">
                                                    {['Password', 'OTP', 'Both'].map(method => (
                                                        <button
                                                            key={method}
                                                            type="button"
                                                            onClick={() => setEditUserData({ ...editUserData, authMethod: method })}
                                                            style={{
                                                                flex: 1,
                                                                padding: '0.5rem 0.75rem',
                                                                borderRadius: '0.5rem',
                                                                fontSize: '0.875rem',
                                                                fontWeight: '500',
                                                                transition: 'all 0.2s',
                                                                background: editUserData.authMethod === method ? 'var(--bg-card)' : 'transparent',
                                                                color: editUserData.authMethod === method ? 'var(--primary)' : 'var(--text-secondary)',
                                                                boxShadow: editUserData.authMethod === method ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                                                                border: editUserData.authMethod === method ? '1px solid var(--primary)' : '1px solid transparent'
                                                            }}
                                                        >
                                                            {method}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between md:justify-end gap-3">
                                                <div>
                                                    <h4 style={{ fontWeight: '600', fontSize: '0.875rem', color: 'var(--text-main)' }}>Force Password Reset</h4>
                                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Require reset on next login</p>
                                                </div>
                                                <label className="switch switch-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={editUserData.requirePasswordReset}
                                                        onChange={(e) => setEditUserData({ ...editUserData, requirePasswordReset: e.target.checked })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="form-group col-span-2">
                                        <div className="flex justify-between items-center bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                            <div>
                                                <h4 className="font-bold text-sm text-yellow-800">Need Password Reset?</h4>
                                                <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>Send password reset email to user.</p>
                                            </div>
                                            <button
                                                className="px-3 py-1.5 bg-white text-yellow-700 text-xs font-semibold rounded border border-yellow-200 hover:bg-yellow-50 transition-colors"
                                                onClick={() => handlePasswordReset(selectedUserForAction)}
                                            >
                                                Reset Password
                                            </button>
                                        </div>
                                    </div>

                                    {isSuperAdmin && (
                                        <div className="form-group col-span-2">
                                            <div className="flex justify-between items-center bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                <div>
                                                    <h4 className="font-bold text-sm text-purple-800">Super Admin Managed</h4>
                                                    <p style={{ color: '#6b7280', fontSize: '0.75rem' }}>Only Super Admin can edit/delete this user.</p>
                                                </div>
                                                <label className="switch switch-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={editUserData.isSuperAdminManaged || false}
                                                        onChange={(e) => setEditUserData({ ...editUserData, isSuperAdminManaged: e.target.checked })}
                                                    />
                                                    <span className="slider"></span>
                                                </label>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="p-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowEditUserModal(false)}
                                    className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveEditUser}
                                    disabled={modalLoading}
                                    className="px-5 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 active:bg-blue-800 transition-colors shadow-lg shadow-blue-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {modalLoading ? (
                                        <><i className="ri-loader-4-line animate-spin"></i> Saving...</>
                                    ) : (
                                        <><i className="ri-save-line"></i> Save Changes</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Access Restrictions Modal */}
            {
                showRestrictModal && (
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={(e) => handleOverlayClick(e, () => setShowRestrictModal(false))}
                    >
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all duration-300 scale-100">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Access Restrictions</h3>
                                    <p className="text-sm text-gray-500 mt-1">Manage permissions for {selectedUserForAction?.name}</p>
                                </div>
                                <button
                                    onClick={() => setShowRestrictModal(false)}
                                    className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                                >
                                    <i className="ri-close-line text-xl"></i>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {modalError && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in">
                                        <i className="ri-error-warning-fill text-xl"></i>
                                        <div>
                                            <h4 className="font-semibold text-sm">Error Updating Permissions</h4>
                                            <p className="text-sm opacity-90">{modalError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm border border-gray-100 group-hover:border-blue-100">
                                                    <i className="ri-phone-line text-lg"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 group-hover:text-blue-700 transition-colors">Make Calls</h4>
                                                    <p className="text-sm text-gray-500">Allow user to initiate calls</p>
                                                </div>
                                            </div>
                                            <div className={`w - 12 h - 6 rounded - full transition - colors relative ${restrictionData.canMakeCalls ? 'bg-blue-500' : 'bg-gray-300'} `}>
                                                <input
                                                    type="checkbox"
                                                    checked={restrictionData.canMakeCalls}
                                                    onChange={(e) => setRestrictionData({ ...restrictionData, canMakeCalls: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <div className={`w - 4 h - 4 bg - white rounded - full absolute top - 1 transition - all shadow - sm ${restrictionData.canMakeCalls ? 'left-7' : 'left-1'} `}></div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-purple-200 hover:bg-purple-50/50 transition-all group">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-purple-600 shadow-sm border border-gray-100 group-hover:border-purple-100">
                                                    <i className="ri-edit-line text-lg"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 group-hover:text-purple-700 transition-colors">Edit Leads</h4>
                                                    <p className="text-sm text-gray-500">Allow user to modify lead info</p>
                                                </div>
                                            </div>
                                            <div className={`w - 12 h - 6 rounded - full transition - colors relative ${restrictionData.canEditLeads ? 'bg-purple-500' : 'bg-gray-300'} `}>
                                                <input
                                                    type="checkbox"
                                                    checked={restrictionData.canEditLeads}
                                                    onChange={(e) => setRestrictionData({ ...restrictionData, canEditLeads: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <div className={`w - 4 h - 4 bg - white rounded - full absolute top - 1 transition - all shadow - sm ${restrictionData.canEditLeads ? 'left-7' : 'left-1'} `}></div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-red-200 hover:bg-red-50/50 transition-all group">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-red-600 shadow-sm border border-gray-100 group-hover:border-red-100">
                                                    <i className="ri-delete-bin-line text-lg"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 group-hover:text-red-700 transition-colors">Delete Leads</h4>
                                                    <p className="text-sm text-gray-500">Allow user to delete leads</p>
                                                </div>
                                            </div>
                                            <div className={`w - 12 h - 6 rounded - full transition - colors relative ${restrictionData.canDeleteLeads ? 'bg-red-500' : 'bg-gray-300'} `}>
                                                <input
                                                    type="checkbox"
                                                    checked={restrictionData.canDeleteLeads}
                                                    onChange={(e) => setRestrictionData({ ...restrictionData, canDeleteLeads: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <div className={`w - 4 h - 4 bg - white rounded - full absolute top - 1 transition - all shadow - sm ${restrictionData.canDeleteLeads ? 'left-7' : 'left-1'} `}></div>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-yellow-200 hover:bg-yellow-50/50 transition-all group">
                                        <label className="flex items-center justify-between cursor-pointer">
                                            <div className="flex gap-3 items-center">
                                                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-yellow-600 shadow-sm border border-gray-100 group-hover:border-yellow-100">
                                                    <i className="ri-download-line text-lg"></i>
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-gray-800 group-hover:text-yellow-700 transition-colors">Export Data</h4>
                                                    <p className="text-sm text-gray-500">Allow user to export reports</p>
                                                </div>
                                            </div>
                                            <div className={`w - 12 h - 6 rounded - full transition - colors relative ${restrictionData.canExport ? 'bg-yellow-500' : 'bg-gray-300'} `}>
                                                <input
                                                    type="checkbox"
                                                    checked={restrictionData.canExport}
                                                    onChange={(e) => setRestrictionData({ ...restrictionData, canExport: e.target.checked })}
                                                    className="hidden"
                                                />
                                                <div className={`w - 4 h - 4 bg - white rounded - full absolute top - 1 transition - all shadow - sm ${restrictionData.canExport ? 'left-7' : 'left-1'} `}></div>
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setShowRestrictModal(false)}
                                    className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSaveRestrictions}
                                    disabled={modalLoading}
                                    className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                >
                                    {modalLoading ? (
                                        <><i className="ri-loader-4-line animate-spin"></i> Saving...</>
                                    ) : (
                                        <><i className="ri-save-line"></i> Save Permissions</>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Role Modal */}
            {
                showAddRoleModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => handleOverlayClick(e, () => setShowAddRoleModal(false))}>
                        <div className="rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col transform transition-all duration-300 scale-100" style={{ background: 'var(--bg-card)' }}>
                            <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: 'var(--border)', background: 'var(--bg-main)' }}>
                                <div>
                                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>Create New Role</h3>
                                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Define a new user role and its appearance</p>
                                </div>
                                <button onClick={() => setShowAddRoleModal(false)} className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors" style={{ color: 'var(--text-secondary)' }}>
                                    <i className="ri-close-line text-xl"></i>
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto custom-scrollbar">
                                {modalError && (
                                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 animate-fade-in">
                                        <i className="ri-error-warning-fill text-xl"></i>
                                        <div>
                                            <h4 className="font-semibold text-sm">Error Creating Role</h4>
                                            <p className="text-sm opacity-90">{modalError}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Role Name</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                            placeholder="e.g. Supervisor"
                                            value={newRoleData.name}
                                            onChange={(e) => setNewRoleData({ ...newRoleData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Role Color</label>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {roleColors.map(color => (
                                                <button
                                                    key={color}
                                                    className={`w - 8 h - 8 rounded - full border - 2 transition - transform hover: scale - 110 ${newRoleData.color === color ? 'border-gray-600 scale-110' : 'border-transparent'} `}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setNewRoleData({ ...newRoleData, color })}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="form-group">
                                        <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Description (Optional)</label>
                                        <textarea
                                            className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                                            placeholder="Briefly describe the responsibilities of this role..."
                                            rows="3"
                                            value={newRoleData.description}
                                            onChange={(e) => setNewRoleData({ ...newRoleData, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div className="form-group flex items-center justify-between">
                                        <div>
                                            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Super Admin Role</label>
                                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                If enabled, this role is only for supervision and not available for regular users.
                                            </p>
                                        </div>
                                        <label className="switch switch-sm">
                                            <input
                                                type="checkbox"
                                                checked={newRoleData.isSuperAdminRole || false}
                                                onChange={(e) => setNewRoleData({ ...newRoleData, isSuperAdminRole: e.target.checked })}
                                            />
                                            <span className="slider"></span>
                                        </label>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Permissions</label>
                                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-50 text-gray-700 font-semibold">
                                                <tr>
                                                    <th className="px-3 py-2 text-left">Module</th>
                                                    <th className="px-3 py-2 text-center">View</th>
                                                    <th className="px-3 py-2 text-center">Edit</th>
                                                    <th className="px-3 py-2 text-center">Delete</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {Object.entries(newRoleData.permissions || {}).map(([module, perms]) => (
                                                    <tr key={module} className="hover:bg-gray-50">
                                                        <td className="px-3 py-2">
                                                            <span className="capitalize font-medium text-gray-600">{module}</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={perms.view}
                                                                onChange={(e) => setNewRoleData({
                                                                    ...newRoleData,
                                                                    permissions: {
                                                                        ...newRoleData.permissions,
                                                                        [module]: { ...perms, view: e.target.checked }
                                                                    }
                                                                })}
                                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={perms.edit}
                                                                onChange={(e) => setNewRoleData({
                                                                    ...newRoleData,
                                                                    permissions: {
                                                                        ...newRoleData.permissions,
                                                                        [module]: { ...perms, edit: e.target.checked }
                                                                    }
                                                                })}
                                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                            />
                                                        </td>
                                                        <td className="px-3 py-2 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={perms.delete}
                                                                onChange={(e) => setNewRoleData({
                                                                    ...newRoleData,
                                                                    permissions: {
                                                                        ...newRoleData.permissions,
                                                                        [module]: { ...perms, delete: e.target.checked }
                                                                    }
                                                                })}
                                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                                            />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button onClick={() => setShowAddRoleModal(false)} className="px-5 py-2.5 rounded-lg text-gray-600 font-medium hover:bg-gray-100 transition-colors">Cancel</button>
                                <button onClick={handleAddRole} className="px-5 py-2.5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 active:bg-purple-800 transition-colors shadow-lg shadow-purple-600/20 flex items-center gap-2">
                                    <i className="ri-add-line"></i> Create Role
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserManagement;