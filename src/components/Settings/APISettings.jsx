import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import { getSettings, saveSettings, getEffectiveApiSettings, saveUserSettings } from '../../utils/api';
import { getUser } from '../../utils/permissions';
import SectionHeader from './SectionHeader';

const APIServiceCard = ({ name, status, apiKey, lastUsed, color, isInherited, onEdit, onToggle, onDelete }) => {
    // Brand Color Logic - uses user-selected color or falls back to name-based defaults
    const getBrandColor = (color, name) => {
        if (color) {
            // User-selected color - derive light/dark variants
            return {
                bg: `${color}20`,
                text: color,
                border: color
            };
        }
        // Fallback: derive from name for backwards compatibility
        const n = name.toLowerCase();
        if (n.includes('openai')) return {
            bg: '#DCFCE7',
            text: '#166534',
            border: '#10B981'
        };
        if (n.includes('gemini')) return {
            bg: '#DBEAFE',
            text: '#1E40AF',
            border: '#3B82F6'
        };
        if (n.includes('claude') || n.includes('anthropic')) return {
            bg: '#FFEDD5',
            text: '#9A3412',
            border: '#F97316'
        };
        if (n.includes('groq')) return {
            bg: '#F3E8FF',
            text: '#6B21A8',
            border: '#A855F7'
        };
        return {
            bg: '#F3F4F6',
            text: '#374151',
            border: '#9CA3AF'
        };
    };

    const brand = getBrandColor(color, name);

    return (
        <div
            style={{
                background: 'var(--bg-card)',
                borderRadius: '0.75rem',
                border: `2px solid ${brand.border}50`,
                overflow: 'hidden',
                transition: 'all 0.3s',
                cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
            }}
        >
            {/* Card Content */}
            <div style={{ padding: '1rem' }}>
                {/* Icon, Title and Toggle Row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                        style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '0.625rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            backgroundColor: brand.bg,
                            color: brand.text,
                            fontSize: '1.25rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                    >
                        <i className="ri-cpu-line"></i>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                        <h3 style={{
                            fontWeight: '700',
                            fontSize: '0.95rem',
                            marginBottom: '0',
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>{name}</h3>

                        {/* Status Message */}
                        <p style={{
                            fontSize: '0.7rem',
                            marginBottom: '0.25rem',
                            color: status === 'Active' ? brand.border : 'var(--text-secondary)'
                        }}>
                            {status === 'Active' ? 'Connected and ready' : 'Click to configure'}
                        </p>
                        {isInherited && (
                            <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.6rem',
                                color: 'var(--text-secondary)',
                                background: 'var(--bg-hover)',
                                padding: '0.125rem 0.5rem',
                                borderRadius: '0.25rem'
                            }}>
                                <i className="ri-lock-2-line"></i>
                                Inherited
                            </span>
                        )}
                    </div>

                    {/* Toggle Switch */}
                    <label
                        style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '44px',
                            height: '24px',
                            flexShrink: 0
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <input
                            type="checkbox"
                            checked={status === 'Active'}
                            onChange={onToggle}
                            style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                            position: 'absolute',
                            cursor: 'pointer',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: status === 'Active' ? brand.border : 'var(--border)',
                            transition: '0.3s',
                            borderRadius: '24px'
                        }}>
                            <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '18px',
                                width: '18px',
                                left: status === 'Active' ? '23px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                transition: '0.3s',
                                borderRadius: '50%',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                            }}></span>
                        </span>
                    </label>
                </div>

                {/* Action Buttons Row */}
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                    <button
                        onClick={onEdit}
                        style={{
                            height: '1.75rem',
                            padding: '0 0.75rem',
                            borderRadius: '0.375rem',
                            backgroundColor: 'var(--bg-hover)',
                            color: 'var(--text-secondary)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.375rem',
                            transition: 'all 0.2s',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = brand.border;
                            e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                            e.currentTarget.style.color = 'var(--text-secondary)';
                        }}
                        title="Configure"
                    >
                        <i className="ri-settings-4-line" style={{ fontSize: '0.875rem' }}></i>
                    </button>

                    {onDelete && (
                        <button
                            onClick={onDelete}
                            style={{
                                height: '1.75rem',
                                padding: '0 0.75rem',
                                borderRadius: '0.375rem',
                                backgroundColor: 'var(--bg-hover)',
                                color: 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.375rem',
                                transition: 'all 0.2s',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#EF4444';
                                e.currentTarget.style.color = 'white';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                                e.currentTarget.style.color = 'var(--text-secondary)';
                            }}
                            title="Delete"
                        >
                            <i className="ri-delete-bin-line" style={{ fontSize: '0.875rem' }}></i>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const APISettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingService, setEditingService] = useState(null); // For edit modal
    const [newService, setNewService] = useState({ name: '', apiKey: '', color: '#10B981' });
    const [sources, setSources] = useState({}); // To track inheritance sources

    // Preset color options for user selection
    const colorOptions = [
        { name: 'Green', color: '#10B981' },
        { name: 'Blue', color: '#3B82F6' },
        { name: 'Orange', color: '#F97316' },
        { name: 'Purple', color: '#A855F7' },
        { name: 'Red', color: '#EF4444' },
        { name: 'Cyan', color: '#06B6D4' },
        { name: 'Pink', color: '#EC4899' },
        { name: 'Yellow', color: '#F59E0B' }
    ];

    const [aiServices, setAiServices] = useState([]); // Empty by default, loaded from database

    const [twilio, setTwilio] = useState({ accountSid: '', authToken: '' });
    const [whatsapp, setWhatsapp] = useState({ phoneNumberId: '', accessToken: '' });
    const [smtp, setSmtp] = useState({ host: '', port: '', username: '', password: '' });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const user = getUser();
            if (!user) {
                setLoading(false);
                return;
            }
            const userId = user._id || user.id;

            const data = await getEffectiveApiSettings('api', userId);

            if (data && data.config) {
                const config = data.config;
                if (config.aiServices) setAiServices(config.aiServices);
                if (config.twilio) setTwilio(config.twilio);
                if (config.whatsapp) setWhatsapp(config.whatsapp);
                if (config.smtp) setSmtp(config.smtp);

                if (data.sources) setSources(data.sources);
            }
        } catch (err) {
            showToast('Failed to load API settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);
            const user = getUser();
            if (!user) {
                showToast('You must be logged in to save settings', 'error');
                setSaving(false);
                return;
            }
            const userId = user._id || user.id;
            const userRole = user.systemRole || user.role;

            if (userRole === 'SuperAdmin') {
                // SuperAdmin saves global settings
                await saveSettings('api', {
                    aiServices: aiServices.filter(s => !s.isInherited),
                    twilio,
                    whatsapp,
                    smtp
                });
            } else {
                // Admin saves user-scoped settings (only their own services)
                const userOwnedServices = aiServices.filter(s => !s.isInherited);
                await saveUserSettings('api', userId, {
                    aiServices: userOwnedServices,
                    twilio,
                    whatsapp,
                    smtp
                });
            }
            showToast('API repository updated!', 'success');
        } catch (err) {
            showToast('Failed to synchronize APIs', 'error');
        } finally {
            setSaving(false);
        }
    };

    const toggleService = (id) => {
        setAiServices(prev => prev.map(svc =>
            svc.id === id ? { ...svc, status: svc.status === 'Active' ? 'Inactive' : 'Active' } : svc
        ));
    };

    const handleAddService = () => {
        if (!newService.name || !newService.apiKey) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        const newId = Math.max(...aiServices.map(s => s.id), 0) + 1;
        setAiServices([...aiServices, { ...newService, id: newId, status: 'Active', lastUsed: 'Just now' }]);
        setNewService({ name: '', apiKey: '', color: '#10B981' });
        setShowAddModal(false);
        showToast('New AI Service connected!', 'success');
    };

    const handleEditService = (service) => {
        setEditingService({ ...service });
    };

    const handleUpdateService = () => {
        if (!editingService.name || !editingService.apiKey) {
            showToast('Please fill in all fields', 'error');
            return;
        }
        setAiServices(prev => prev.map(svc =>
            svc.id === editingService.id ? editingService : svc
        ));
        setEditingService(null);
        showToast('Service updated successfully!', 'success');
    };

    const handleDeleteService = (id) => {
        setAiServices(aiServices.filter(s => s.id !== id));
        showToast('Service removed', 'info');
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem' }}>
                <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <span style={{ marginLeft: '0.75rem', fontWeight: '500' }}>Loading API registry...</span>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                    {toast.message}
                </div>
            )}

            {/* Inheritance Badge Area */}
            {Object.values(sources || {}).some(id => id) && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-main)', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <i className="ri-information-line"></i>
                    <span>
                        Settings are currently inherited from:
                        {sources.organization && <span className="font-semibold ml-1">Organization</span>}
                        {sources.group && <span className="font-semibold ml-1">Group</span>}
                        {sources.system && <span className="font-semibold ml-1">System</span>}
                        {sources.user && <span className="font-semibold ml-1 text-green-600">(Personal Overrides Active)</span>}
                    </span>
                </div>
            )}


            {/* Add Service Modal - Portal (Reference: ReportModal) */}
            {showAddModal && createPortal(
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div style={{
                        width: '500px',
                        maxWidth: '95vw',
                        background: 'var(--bg-card)',
                        borderRadius: '1rem',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'hidden'
                    }} className="animate-scale-in">
                        {/* Header with Brand Color */}
                        <div style={{
                            padding: '1.25rem 1.5rem',
                            background: 'var(--primary)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '10px',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <i className="ri-add-line" style={{ fontSize: '20px', color: 'white' }}></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>Connect New Provider</h3>
                                    <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.8rem' }}>Add a new API service integration</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    border: 'none',
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                            >
                                <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '1.5rem' }}>
                            <div className="form-group mb-5">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Provider Name</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    placeholder="e.g. Mistral AI"
                                    value={newService.name}
                                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                                    autoFocus
                                    style={{ padding: '0.75rem' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>API Secret Key</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-input w-full pl-10"
                                        placeholder="sk-..."
                                        value={newService.apiKey}
                                        onChange={(e) => setNewService({ ...newService, apiKey: e.target.value })}
                                        style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500' }}
                                    />
                                    <i className="ri-key-2-line" style={{ fontSize: '1.25rem', color: '#9CA3AF', position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}></i>
                                </div>
                                <p className="mt-2 ml-1 flex items-center" style={{ color: '#9CA3AF', fontSize: '0.75rem', gap: '0.25rem' }}>
                                    <i className="ri-shield-check-line" style={{ color: '#4ade80' }}></i>
                                    Key is encrypted and stored securely.
                                </p>
                            </div>

                            {/* Color Picker */}
                            <div className="form-group mt-5">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>
                                    Brand Color
                                </label>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    {colorOptions.map(opt => (
                                        <button
                                            key={opt.color}
                                            type="button"
                                            onClick={() => setNewService({ ...newService, color: opt.color })}
                                            style={{
                                                width: '36px',
                                                height: '36px',
                                                borderRadius: '50%',
                                                backgroundColor: opt.color,
                                                border: newService.color === opt.color ? '3px solid white' : '3px solid transparent',
                                                boxShadow: newService.color === opt.color ? `0 0 0 2px ${opt.color}` : 'none',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                            title={opt.name}
                                        />
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border)',
                            background: 'var(--bg-main)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem'
                        }}>
                            <button
                                className="btn"
                                onClick={() => setShowAddModal(false)}
                                style={{
                                    background: 'var(--bg-card)',
                                    border: '1px solid #e5e7eb',
                                    color: '#374151',
                                    padding: '0.625rem 1.25rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleAddService}
                                style={{
                                    padding: '0.625rem 1.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)'
                                }}
                            >
                                <i className="ri-plug-line mr-2"></i> Connect Service
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            {/* Edit Service Modal */}
            {editingService && createPortal(
                <div className="modal-overlay" style={{ zIndex: 10000 }}>
                    <div style={{
                        background: 'var(--bg-card)',
                        borderRadius: '1.5rem',
                        width: '90%',
                        maxWidth: '500px',
                        overflow: 'hidden',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }} className="animate-scale-in">
                        {/* Modal Header */}
                        <div style={{
                            padding: '1.5rem 2rem',
                            background: 'linear-gradient(135deg, var(--primary, #F59E0B) 0%, var(--primary-dark, #D97706) 100%)',
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
                                    justifyContent: 'center'
                                }}>
                                    <i className="ri-settings-3-line" style={{ fontSize: '24px', color: 'white' }}></i>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '700' }}>Configure Service</h3>
                                    <p style={{ margin: 0, opacity: 0.9, fontSize: '0.875rem' }}>Update API credentials</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setEditingService(null)}
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
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                            >
                                <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div style={{ padding: '2rem' }}>
                            <div className="form-group mb-5">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>Service Name</label>
                                <input
                                    type="text"
                                    className="form-input w-full"
                                    placeholder="e.g. OpenAI API"
                                    value={editingService.name}
                                    onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                                    style={{ padding: '0.75rem' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>API Secret Key</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        className="form-input w-full pl-10"
                                        placeholder="sk-..."
                                        value={editingService.apiKey}
                                        onChange={(e) => setEditingService({ ...editingService, apiKey: e.target.value })}
                                        style={{ padding: '0.75rem 0.75rem 0.75rem 2.5rem', fontSize: '0.875rem', fontWeight: '500' }}
                                    />
                                    <i className="ri-key-2-line" style={{ fontSize: '1.25rem', color: '#9CA3AF', position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}></i>
                                </div>
                                <p className="mt-2 ml-1 flex items-center" style={{ color: '#9CA3AF', fontSize: '0.75rem', gap: '0.25rem' }}>
                                    <i className="ri-shield-check-line" style={{ color: '#4ade80' }}></i>
                                    Key is encrypted and stored securely.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div style={{
                            padding: '1rem 1.5rem',
                            borderTop: '1px solid var(--border)',
                            background: 'var(--bg-main)',
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: '0.75rem'
                        }}>
                            <button
                                className="btn"
                                onClick={() => setEditingService(null)}
                                style={{
                                    background: 'white',
                                    border: '1px solid #e5e7eb',
                                    color: '#374151',
                                    padding: '0.625rem 1.25rem'
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary"
                                onClick={handleUpdateService}
                                style={{
                                    background: 'var(--primary, #F59E0B)',
                                    color: 'white',
                                    padding: '0.625rem 1.5rem',
                                    fontWeight: '600'
                                }}
                            >
                                <i className="ri-save-line mr-2"></i> Update Service
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}


            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
                {/* AI Services Section */}
                <div style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)', background: 'var(--bg-card)' }}>
                    <div style={{ background: 'rgba(249, 250, 251, 0.5)' }}>
                        <SectionHeader
                            icon="ri-brain-line"
                            title="AI Insight Engines"
                            subtitle="Manage large language model API integrations"
                            color="#8B5CF6"
                        />
                    </div>

                    <div style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ fontWeight: '700', color: '#374151', fontSize: '0.875rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Integrations</h4>
                            <button
                                onClick={() => setShowAddModal(true)}
                                style={{
                                    color: 'var(--primary, #F59E0B)',
                                    fontWeight: '500',
                                    fontSize: '0.875rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.375rem 0.75rem',
                                    borderRadius: '0.5rem',
                                    transition: 'all 0.2s',
                                    border: 'none',
                                    background: 'transparent',
                                    cursor: 'pointer'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--primary-light, #FEF3C7)';
                                    e.currentTarget.style.color = 'var(--primary-dark, #D97706)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.color = 'var(--primary, #F59E0B)';
                                }}
                            >
                                <i className="ri-add-line"></i> Add New
                            </button>
                        </div>

                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                            gap: '1rem'
                        }}>
                            {aiServices.map(service => (
                                <APIServiceCard
                                    key={service.id}
                                    {...service}
                                    onToggle={() => toggleService(service.id)}
                                    onEdit={service.isInherited ? null : () => handleEditService(service)}
                                    onDelete={service.isInherited ? null : () => handleDeleteService(service.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Communication APIs */}
                    <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                        <SectionHeader
                            icon="ri-message-3-line"
                            title="Communication Bridge"
                            subtitle="Configure WhatsApp and SMTP relay settings"
                            color="#3B82F6"
                        />

                        <div className="flex flex-col gap-3" style={{ padding: '1.5rem' }}>
                            <div className="bg-main p-4 rounded-lg border border-border">
                                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                    <i className="ri-whatsapp-line text-green-500"></i> WhatsApp Business
                                </h4>
                                <div className="flex flex-col gap-3">
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Phone Number ID</label>
                                        <input
                                            type="text"
                                            placeholder="Enter ID"
                                            value={whatsapp.phoneNumberId}
                                            onChange={(e) => setWhatsapp({ ...whatsapp, phoneNumberId: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Access Token</label>
                                        <input
                                            type="password"
                                            placeholder="••••••••••••••••"
                                            value={whatsapp.accessToken}
                                            onChange={(e) => setWhatsapp({ ...whatsapp, accessToken: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-main p-4 rounded-lg border border-border">
                                <h4 className="text-sm font-bold mb-4 flex items-center gap-2">
                                    <i className="ri-mail-send-line text-orange-500"></i> SMTP Gateway
                                </h4>
                                <div className="settings-grid-2">
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Host</label>
                                        <input
                                            type="text"
                                            placeholder="smtp.gmail.com"
                                            value={smtp.host}
                                            onChange={(e) => setSmtp({ ...smtp, host: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Port</label>
                                        <input
                                            type="text"
                                            placeholder="587"
                                            value={smtp.port}
                                            onChange={(e) => setSmtp({ ...smtp, port: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="form-group mt-3" style={{ marginBottom: '0' }}>
                                    <label>Auth User</label>
                                    <input
                                        type="text"
                                        placeholder="user@example.com"
                                        value={smtp.username}
                                        onChange={(e) => setSmtp({ ...smtp, username: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '1rem' }}>
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.75rem 3rem', fontSize: '1rem' }}
                    onClick={handleSaveAll}
                    disabled={saving}
                >
                    {saving ? (
                        <><i className="ri-loader-4-line spin mr-2"></i> Syncing...</>
                    ) : (
                        <><i className="ri-save-line mr-2"></i> Save All API Configs</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default APISettings;
