import React, { useState, useEffect } from 'react';
import { getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../../utils/api';
import SectionHeader from './SectionHeader';
import ConfirmationModal from '../Shared/ConfirmationModal';
import { hasPermission, PERMISSIONS, ROLES } from '../../utils/permissions';

const SettingsTemplates = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [error, setError] = useState(null);
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Form Stats
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'calling',
        level: 'organization',
        targetRole: 'all',
        priority: 0,
        config: '{}'
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const data = await getTemplates();
            setTemplates(data);
            setLoading(false);
        } catch (err) {
            setError('Failed to load templates');
            setLoading(false);
        }
    };

    const handleOpenModal = (template = null) => {
        if (template) {
            setEditingTemplate(template);
            setFormData({
                name: template.name,
                description: template.description || '',
                type: template.type,
                level: template.level,
                targetRole: template.targetRole,
                priority: template.priority,
                config: JSON.stringify(template.config, null, 2)
            });
        } else {
            setEditingTemplate(null);
            setFormData({
                name: '',
                description: '',
                type: 'calling',
                level: 'organization',
                targetRole: 'all',
                priority: 0,
                config: '{}'
            });
        }
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            // Validate JSON
            let parsedConfig;
            try {
                parsedConfig = JSON.parse(formData.config);
            } catch (e) {
                alert('Invalid JSON in Config field');
                return;
            }

            const payload = {
                ...formData,
                config: parsedConfig
            };

            if (editingTemplate) {
                await updateTemplate(editingTemplate._id, payload);
            } else {
                await createTemplate(payload);
            }

            setShowModal(false);
            fetchTemplates();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDelete = async (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Template',
            message: 'Are you sure you want to delete this template? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteTemplate(id);
                    fetchTemplates();
                } catch (err) {
                    alert('Failed to delete template');
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            overflow: 'hidden'
        }}>
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
            />
            <SectionHeader
                title="Settings Templates"
                subtitle="Manage default settings configurations for different roles across your organization."
                icon="ri-file-settings-line"
                color="#6366f1"
                action={
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn"
                        style={{
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            border: 'none'
                        }}
                    >
                        <i className="ri-add-line mr-1"></i> Create Template
                    </button>
                }
            />

            <div style={{ padding: '1.5rem' }}>
                {error && (
                    <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                        {error}
                    </div>
                )}
                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: 'var(--bg-main)', color: 'var(--text-secondary)', fontSize: '0.875rem', textAlign: 'left' }}>
                                <th style={{ padding: '1rem', fontWeight: '600' }}>Name</th>
                                <th style={{ padding: '1rem', fontWeight: '600' }}>Type</th>
                                <th style={{ padding: '1rem', fontWeight: '600' }}>Level</th>
                                <th style={{ padding: '1rem', fontWeight: '600' }}>Target Role</th>
                                <th style={{ padding: '1rem', fontWeight: '600' }}>Priority</th>
                                <th style={{ padding: '1rem', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {templates.map(template => (
                                <tr key={template._id} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '1rem', fontWeight: '500', color: 'var(--text-main)' }}>{template.name}</td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{
                                            background: '#e0e7ff', color: '#4338ca',
                                            padding: '0.25rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase'
                                        }}>
                                            {template.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textTransform: 'capitalize' }}>{template.level}</td>
                                    <td style={{ padding: '1rem' }}>{template.targetRole}</td>
                                    <td style={{ padding: '1rem' }}>{template.priority}</td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                            <button
                                                onClick={() => handleOpenModal(template)}
                                                style={{ color: '#4f46e5', padding: '0.5rem', background: '#eef2ff', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
                                                title="Edit"
                                            >
                                                <i className="ri-edit-line"></i>
                                            </button>
                                            <button
                                                onClick={() => handleDelete(template._id)}
                                                style={{ color: '#dc2626', padding: '0.5rem', background: '#fef2f2', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
                                                title="Delete"
                                            >
                                                <i className="ri-delete-bin-line"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
                }}>
                    <div style={{ background: 'var(--bg-card)', borderRadius: '1rem', padding: '2rem', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                            {editingTemplate ? 'Edit Template' : 'Create Template'}
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                    placeholder="e.g. Sales Team Default"
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Type</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                >
                                    <option value="calling">Calling</option>
                                    <option value="api">API</option>
                                    <option value="leads">Leads</option>
                                    <option value="system">System</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Level</label>
                                <select
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                >
                                    <option value="organization">Organization</option>
                                    <option value="group">Group</option>
                                    <option value="system">System (SuperAdmin)</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Target Role</label>
                                <select
                                    value={formData.targetRole}
                                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                                    style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                                >
                                    <option value="all">All</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="User">User</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Priority (Higher overrides Lower)</label>
                            <input
                                type="number"
                                value={formData.priority}
                                onChange={(e) => setFormData({ ...formData, priority: parseInt(e.target.value) })}
                                style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                            />
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem' }}>Config (JSON)</label>
                            <textarea
                                value={formData.config}
                                onChange={(e) => setFormData({ ...formData, config: e.target.value })}
                                style={{ width: '100%', height: '150px', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', realm: 'monospace' }}
                            />
                            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                Enter valid JSON configuration. Example: {`{"allowInternational": true}`}
                            </p>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                            <button
                                onClick={() => setShowModal(false)}
                                style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', borderRadius: '0.375rem', background: 'var(--bg-card)', cursor: 'pointer' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                style={{ padding: '0.5rem 1rem', background: '#4f46e5', color: 'white', borderRadius: '0.375rem', border: 'none', cursor: 'pointer' }}
                            >
                                Save Template
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsTemplates;
