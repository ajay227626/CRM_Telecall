import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { hasPermission, PERMISSIONS } from '../../utils/permissions';

const MetaIntegrationsSettings = () => {
    const [integrations, setIntegrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingIntegration, setEditingIntegration] = useState(null);
    const [users, setUsers] = useState([]);

    useEffect(() => {
        loadIntegrations();
        loadUsers();
    }, []);

    const loadIntegrations = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/meta/integrations`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setIntegrations(response.data);
        } catch (error) {
            console.error('Failed to load integrations', error);
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/users`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setUsers(response.data.filter(u => u.isActive));
        } catch (error) {
            console.error('Failed to load users', error);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/meta/auth-url`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Redirect to Meta OAuth
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Failed to get auth URL', error);
            alert('Failed to connect to Meta');
        }
    };

    const handleUpdateIntegration = async (integration) => {
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/api/meta/integrations/${integration._id}`,
                integration,
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            await loadIntegrations();
            setEditingIntegration(null);
            alert('Integration updated successfully');
        } catch (error) {
            console.error('Failed to update integration', error);
            alert('Failed to update integration');
        }
    };

    const handleDeleteIntegration = async (id) => {
        if (!confirm('Are you sure you want to delete this integration? All webhook configurations will be lost.')) {
            return;
        }

        try {
            await axios.delete(`${import.meta.env.VITE_API_URL}/api/meta/integrations/${id}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            await loadIntegrations();
            alert('Integration deleted successfully');
        } catch (error) {
            console.error('Failed to delete integration', error);
            alert('Failed to delete integration');
        }
    };

    const handleSync = async (id) => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/meta/integrations/${id}/sync`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            await loadIntegrations();
            alert('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed', error);
            alert('Failed to sync leads');
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <i className="ri-loader-4-line spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
                <p>Loading Meta integrations...</p>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div>
                    <h3 style={{ margin: 0, marginBottom: '0.5rem' }}>Meta Lead Ads Integration</h3>
                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        Connect Meta (Facebook/Instagram) accounts to automatically sync leads from ad campaigns.
                        You can add multiple accounts for different campaigns.
                    </p>
                </div>
                <button
                    onClick={handleConnect}
                    style={{
                        padding: '0.75rem 1.5rem',
                        background: 'linear-gradient(135deg, #1877f2, #0a5fd7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)',
                        transition: 'transform 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                >
                    <i className="ri-add-line" style={{ fontSize: '20px' }}></i>
                    Add Meta Account
                </button>
            </div>

            {/* Integrations List */}
            {integrations.length === 0 ? (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '3rem 2rem',
                    textAlign: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, #1877f2, #0a5fd7)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(24, 119, 242, 0.3)'
                    }}>
                        <i className="ri-facebook-fill" style={{ fontSize: '40px', color: 'white' }}></i>
                    </div>
                    <h4 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>No Meta Accounts Connected</h4>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto' }}>
                        Connect your first Meta account to start receiving leads from Facebook and Instagram ad campaigns automatically.
                    </p>
                </div>
            ) : (
                integrations.map((integration) => (
                    <IntegrationCard
                        key={integration._id}
                        integration={integration}
                        users={users}
                        onUpdate={handleUpdateIntegration}
                        onDelete={handleDeleteIntegration}
                        onSync={handleSync}
                        isEditing={editingIntegration?._id === integration._id}
                        onEdit={() => setEditingIntegration(integration)}
                        onCancelEdit={() => setEditingIntegration(null)}
                    />
                ))
            )}
        </div>
    );
};

// Integration Card Component
const IntegrationCard = ({ integration, users, onUpdate, onDelete, onSync, isEditing, onEdit, onCancelEdit }) => {
    const [formData, setFormData] = useState({
        accountName: integration.accountName,
        description: integration.description,
        leadAssignment: integration.leadAssignment,
        assignTo: integration.assignTo?._id || '',
        isActive: integration.isActive
    });

    const handleSave = () => {
        onUpdate({ ...integration, ...formData });
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            padding: '1.5rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: integration.isActive ? '2px solid #10b981' : '2px solid var(--border)'
        }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                    {isEditing ? (
                        <div style={{ marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={formData.accountName}
                                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.375rem',
                                    fontSize: '1.125rem',
                                    fontWeight: '600',
                                    marginBottom: '0.5rem',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)'
                                }}
                                placeholder="Account Name"
                            />
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '0.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.375rem',
                                    fontSize: '0.875rem',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)',
                                    minHeight: '60px'
                                }}
                                placeholder="Description (optional)"
                            />
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    background: 'linear-gradient(135deg, #1877f2, #0a5fd7)',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="ri-facebook-fill" style={{ fontSize: '24px', color: 'white' }}></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-main)' }}>
                                        {integration.accountName}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: integration.isActive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <i className={integration.isActive ? "ri-checkbox-circle-fill" : "ri-close-circle-fill"}></i>
                                        {integration.isActive ? 'Active' : 'Inactive'}
                                    </p>
                                </div>
                            </div>
                            {integration.description && (
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                    {integration.description}
                                </p>
                            )}
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {!isEditing ? (
                        <>
                            <button
                                onClick={() => onSync(integration._id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.375rem'
                                }}
                            >
                                <i className="ri-refresh-line"></i>
                                Sync
                            </button>
                            <button
                                onClick={onEdit}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="ri-edit-line"></i>
                            </button>
                            <button
                                onClick={() => onDelete(integration._id)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                <i className="ri-delete-bin-line"></i>
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={handleSave}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#10b981',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Save
                            </button>
                            <button
                                onClick={onCancelEdit}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: 'var(--bg-hover)',
                                    color: 'var(--text-main)',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem',
                                    fontWeight: '600',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Settings Section (when editing) */}
            {isEditing && (
                <div style={{
                    padding: '1rem',
                    background: 'var(--bg-hover)',
                    borderRadius: '0.5rem',
                    marginBottom: '1rem'
                }}>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                        Lead Assignment
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name={`assignment-${integration._id}`}
                                value="unassigned"
                                checked={formData.leadAssignment === 'unassigned'}
                                onChange={(e) => setFormData({ ...formData, leadAssignment: e.target.value })}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Leave Unassigned</span>
                        </label>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="radio"
                                name={`assignment-${integration._id}`}
                                value="specific-user"
                                checked={formData.leadAssignment === 'specific-user'}
                                onChange={(e) => setFormData({ ...formData, leadAssignment: e.target.value })}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Assign to Specific User</span>
                        </label>
                        {formData.leadAssignment === 'specific-user' && (
                            <select
                                value={formData.assignTo}
                                onChange={(e) => setFormData({ ...formData, assignTo: e.target.value })}
                                style={{
                                    padding: '0.5rem',
                                    border: '1px solid var(--border)',
                                    borderRadius: '0.375rem',
                                    marginLeft: '1.5rem',
                                    background: 'var(--bg-main)',
                                    color: 'var(--text-main)'
                                }}
                            >
                                <option value="">Select User</option>
                                {users.map(user => (
                                    <option key={user._id} value={user._id}>{user.name}</option>
                                ))}
                            </select>
                        )}
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                            <span style={{ fontSize: '0.875rem' }}>Active (receives leads)</span>
                        </label>
                    </div>
                </div>
            )}

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Leads</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {integration.stats?.totalLeadsSynced || 0}
                    </p>
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Pages</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                        {integration.pages?.length || 0}
                    </p>
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Assignment</p>
                    <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-main)' }}>
                        {integration.leadAssignment === 'specific-user' && integration.assignTo ?
                            integration.assignTo.name :
                            integration.leadAssignment === 'round-robin' ? 'Round Robin' : 'Unassigned'
                        }
                    </p>
                </div>
            </div>

            {/* Connected Pages */}
            {integration.pages && integration.pages.length > 0 && (
                <div>
                    <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                        Connected Pages ({integration.pages.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {integration.pages.map((page, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '0.75rem',
                                    background: 'var(--bg-hover)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.875rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <i className="ri-pages-line" style={{ color: 'var(--primary)' }}></i>
                                    <span style={{ fontWeight: '600' }}>{page.pageName}</span>
                                    <span style={{ color: 'var(--text-secondary)' }}>• {page.forms?.length || 0} forms</span>
                                </div>
                                {page.webhookSubscribed && (
                                    <span style={{ fontSize: '0.75rem', color: '#10b981' }}>
                                        <i className="ri-checkbox-circle-fill"></i> Active
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetaIntegrationsSettings;
