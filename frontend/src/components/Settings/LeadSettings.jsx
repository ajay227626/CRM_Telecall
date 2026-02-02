import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getEffectiveSettings } from '../../utils/api';
import { getUser } from '../../utils/permissions';
import SectionHeader from './SectionHeader';

const CategoryCard = ({ color, name, status, onEdit, onToggle, onDelete }) => (
    <div style={{
        border: '1px solid var(--border)',
        borderRadius: '0.5rem',
        padding: '1rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg-card)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
        transition: 'border-color 0.2s'
    }}
        onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
        onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div className={color} style={{ width: '1rem', height: '1rem', borderRadius: '50%' }}></div>
            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{name}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className={`badge ${status === 'Active' ? 'badge-active' : 'badge-inactive'}`}>{status}</span>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
                <button title="Edit" className="action-btn" onClick={onEdit}>
                    <i className="ri-edit-line"></i>
                </button>
                <button
                    title={status === 'Active' ? 'Disable' : 'Enable'}
                    className={`action-btn ${status === 'Active' ? 'text-danger hover:bg-danger-light' : 'text-primary'}`}
                    onClick={onToggle}
                >
                    <i className={status === 'Active' ? 'ri-shut-down-line' : 'ri-play-circle-line'}></i>
                </button>
            </div>
        </div>
    </div>
);

const AddModal = ({ title, onClose, onAdd, initialData = null }) => {
    const [name, setName] = useState(initialData?.name || '');
    const [color, setColor] = useState(initialData?.color || 'bg-primary');

    const colors = [
        { class: 'bg-primary', hex: '#F59E0B', name: 'Amber' },
        { class: 'bg-blue-500', hex: '#3B82F6', name: 'Blue' },
        { class: 'bg-purple-500', hex: '#A855F7', name: 'Purple' },
        { class: 'bg-orange-500', hex: '#F97316', name: 'Orange' },
        { class: 'bg-pink-500', hex: '#EC4899', name: 'Pink' },
        { class: 'bg-red-500', hex: '#EF4444', name: 'Red' },
        { class: 'bg-indigo-500', hex: '#6366F1', name: 'Indigo' },
        { class: 'bg-yellow-500', hex: '#EAB308', name: 'Yellow' },
        { class: 'bg-green-500', hex: '#10B981', name: 'Green' },
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name.trim()) {
            if (initialData) {
                // Editing existing item
                onAdd({ ...initialData, name: name.trim(), color });
            } else {
                // Adding new item
                onAdd({ name: name.trim(), color, status: 'Active' });
            }
            onClose();
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ width: '400px' }}>
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onClose} className="modal-close">
                        <i className="ri-close-line" style={{ fontSize: '1.25rem' }}></i>
                    </button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                        <div className="form-group">
                            <label>Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Enter label name"
                                autoFocus
                            />
                        </div>
                        <div className="form-group">
                            <label>Pick a Color</label>
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                                {colors.map(c => (
                                    <button
                                        key={c.class}
                                        type="button"
                                        title={c.name}
                                        style={{
                                            width: '2rem',
                                            height: '2rem',
                                            borderRadius: '50%',
                                            backgroundColor: c.hex,
                                            border: color === c.class ? `3px solid ${c.hex}` : '2px solid white',
                                            boxShadow: color === c.class ? `0 0 0 2px var(--primary)` : '0 1px 3px rgba(0,0,0,0.2)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => setColor(c.class)}
                                        onMouseEnter={(e) => {
                                            if (color !== c.class) {
                                                e.currentTarget.style.transform = 'scale(1.1)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'scale(1)';
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn btn-primary">Add New Label</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const LeadSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [showSourceModal, setShowSourceModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null); // For edit modal
    const [editingStatus, setEditingStatus] = useState(null); // For edit modal
    const [editingSource, setEditingSource] = useState(null); // For edit modal
    const [sources, setSources] = useState({}); // To track inheritance sources

    const [categories, setCategories] = useState([
        { id: 1, color: 'bg-green-500', name: 'Real Estate', status: 'Active' },
        { id: 2, color: 'bg-yellow-500', name: 'Construction', status: 'Active' },
        { id: 3, color: 'bg-blue-500', name: 'Insurance', status: 'Active' },
        { id: 4, color: 'bg-purple-500', name: 'Education', status: 'Inactive' }
    ]);

    const [statuses, setStatuses] = useState([
        { id: 1, color: 'bg-gray-500', name: 'New', status: 'Active' },
        { id: 2, color: 'bg-blue-500', name: 'Contacted', status: 'Active' },
        { id: 3, color: 'bg-yellow-500', name: 'Qualified', status: 'Active' },
        { id: 4, color: 'bg-green-500', name: 'Converted', status: 'Active' },
        { id: 5, color: 'bg-red-500', name: 'Lost', status: 'Active' }
    ]);

    const [assignmentRules, setAssignmentRules] = useState({
        mode: 'roundRobin',
        duplicateDetection: true,
        autoFollowUp: true
    });

    const [leadSources, setLeadSources] = useState([
        { id: 1, color: 'bg-blue-500', name: 'Website', status: 'Active' },
        { id: 2, color: 'bg-green-500', name: 'Referral', status: 'Active' },
        { id: 3, color: 'bg-yellow-500', name: 'Cold Call', status: 'Active' },
        { id: 4, color: 'bg-purple-500', name: 'Social Media', status: 'Active' },
        { id: 5, color: 'bg-gray-500', name: 'Other', status: 'Active' }
    ]);

    const [agingConfig, setAgingConfig] = useState({
        fresh: 2,
        warm: 5,
        aging: 10
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const user = getUser();
            const data = await getEffectiveSettings(user.id, 'leads');

            if (data && data.config) {
                const config = data.config;
                if (config.categories) setCategories(config.categories);
                if (config.statuses) setStatuses(config.statuses);
                if (config.assignmentRules) setAssignmentRules(config.assignmentRules);
                if (config.leadSources) setLeadSources(config.leadSources);
                if (config.agingConfig) setAgingConfig(config.agingConfig);

                if (data.sources) setSources(data.sources);
            }
        } catch (err) {
            showToast('Failed to load lead settings', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await saveSettings('leads', {
                categories,
                statuses,
                assignmentRules,
                leadSources,
                agingConfig
            });
            showToast('Lead settings saved successfully!', 'success');
        } catch (err) {
            showToast('Failed to save settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const addCategory = (newCat) => {
        setCategories([...categories, { ...newCat, id: Date.now() }]);
    };

    const addStatus = (newStatus) => {
        setStatuses([...statuses, { ...newStatus, id: Date.now() }]);
    };

    const toggleCategory = (id) => {
        setCategories(prev => prev.map(cat =>
            cat.id === id ? { ...cat, status: cat.status === 'Active' ? 'Inactive' : 'Active' } : cat
        ));
    };

    const toggleStatus = (id) => {
        setStatuses(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s
        ));
    };

    const handleEditCategory = (category) => {
        setEditingCategory({ ...category });
    };

    const handleUpdateCategory = (updated) => {
        setCategories(prev => prev.map(cat =>
            cat.id === updated.id ? updated : cat
        ));
        setEditingCategory(null);
        showToast('Category updated!', 'success');
    };

    const handleEditStatus = (status) => {
        setEditingStatus({ ...status });
    };

    const handleUpdateStatus = (updated) => {
        setStatuses(prev => prev.map(s =>
            s.id === updated.id ? updated : s
        ));
        setEditingStatus(null);
        showToast('Status updated!', 'success');
    };

    const addSource = (newSource) => {
        setLeadSources([...leadSources, { ...newSource, id: Date.now() }]);
    };

    const toggleSource = (id) => {
        setLeadSources(prev => prev.map(s =>
            s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s
        ));
    };

    const handleEditSource = (source) => {
        setEditingSource({ ...source });
    };

    const handleUpdateSource = (updated) => {
        setLeadSources(prev => prev.map(s =>
            s.id === updated.id ? updated : s
        ));
        setEditingSource(null);
        showToast('Lead Source updated!', 'success');
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <span className="ml-3 font-medium">Loading lead settings...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                    {toast.message}
                </div>
            )}

            {/* Inheritance Badge Area */}
            {Object.values(sources || {}).some(id => id) && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: '#1e40af', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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

            {/* Modals */}
            {showCategoryModal && (
                <AddModal
                    title="Add New Category"
                    onClose={() => setShowCategoryModal(false)}
                    onAdd={addCategory}
                />
            )}
            {showStatusModal && (
                <AddModal
                    title="Add New Status"
                    onClose={() => setShowStatusModal(false)}
                    onAdd={addStatus}
                />
            )}

            {/* Edit Category Modal */}
            {editingCategory && (
                <AddModal
                    title="Edit Category"
                    onClose={() => setEditingCategory(null)}
                    onAdd={handleUpdateCategory}
                    initialData={editingCategory}
                />
            )}

            {/* Edit Status Modal */}
            {editingStatus && (
                <AddModal
                    title="Edit Status"
                    onClose={() => setEditingStatus(null)}
                    onAdd={handleUpdateStatus}
                    initialData={editingStatus}
                />
            )}

            {/* Lead Source Modals */}
            {showSourceModal && (
                <AddModal
                    title="Add New Lead Source"
                    onClose={() => setShowSourceModal(false)}
                    onAdd={addSource}
                />
            )}
            {editingSource && (
                <AddModal
                    title="Edit Lead Source"
                    onClose={() => setEditingSource(null)}
                    onAdd={handleUpdateSource}
                    initialData={editingSource}
                />
            )}


            {/* Assignment Rules */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-flow-chart"
                    title="Assignment & Automation"
                    subtitle="Configure lead distribution logic and auto-followups"
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem' }}>
                    <div className="form-group mb-0">
                        <label className="mb-3 block font-bold text-gray-900 text-sm">Assignment Logic</label>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:border-primary transition-all hover:bg-[var(--primary-light)]">
                                <input
                                    type="radio"
                                    name="assign"
                                    checked={assignmentRules.mode === 'roundRobin'}
                                    onChange={() => setAssignmentRules({ ...assignmentRules, mode: 'roundRobin' })}
                                    className="accent-primary w-5 h-5"
                                />
                                <span className="font-medium text-gray-700">Round Robin</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:border-primary transition-all hover:bg-[var(--primary-light)]">
                                <input
                                    type="radio"
                                    name="assign"
                                    checked={assignmentRules.mode === 'manual'}
                                    onChange={() => setAssignmentRules({ ...assignmentRules, mode: 'manual' })}
                                    className="accent-primary w-5 h-5"
                                />
                                <span className="font-medium text-gray-700">Manual Choice</span>
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col divide-y divide-gray-100">
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Duplicate Detection</h4>
                                <p className="text-xs text-gray-500 mt-1">Prevent double entries of same leads.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={assignmentRules.duplicateDetection}
                                    onChange={() => setAssignmentRules({ ...assignmentRules, duplicateDetection: !assignmentRules.duplicateDetection })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Auto Reminders</h4>
                                <p className="text-xs text-gray-500 mt-1">Task follow-ups created automatically.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={assignmentRules.autoFollowUp}
                                    onChange={() => setAssignmentRules({ ...assignmentRules, autoFollowUp: !assignmentRules.autoFollowUp })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="settings-grid-2">
                <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <SectionHeader
                        icon="ri-folders-line"
                        title="Categories"
                        subtitle="Industry-specific lead classifications"
                        action={(
                            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setShowCategoryModal(true)}>
                                <i className="ri-add-line mr-1"></i> Add
                            </button>
                        )}
                    />
                    <div className="flex flex-col gap-3" style={{ padding: '1.5rem' }}>
                        {categories.map(cat => (
                            <CategoryCard
                                key={cat.id}
                                {...cat}
                                onToggle={() => toggleCategory(cat.id)}
                                onEdit={() => handleEditCategory(cat)}
                            />
                        ))}
                    </div>
                </div>

                <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <SectionHeader
                        icon="ri-flag-line"
                        title="Status Pipelines"
                        subtitle="Define lifecycle stages for your leads"
                        action={(
                            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setShowStatusModal(true)}>
                                <i className="ri-add-line mr-1"></i> Add
                            </button>
                        )}
                    />
                    <div className="flex flex-col gap-3" style={{ padding: '1.5rem' }}>
                        {statuses.map(s => (
                            <CategoryCard
                                key={s.id}
                                {...s}
                                onToggle={() => toggleStatus(s.id)}
                                onEdit={() => handleEditStatus(s)}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Lead Aging Configuration */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-time-line"
                    title="Lead Aging Configuration"
                    subtitle="Set day thresholds for lead age indicators"
                />
                <div style={{ padding: '1.5rem' }}>
                    <div className="settings-grid-2">
                        <div className="form-group mb-0">
                            <label>🟢 Fresh (Green)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    value={agingConfig.fresh}
                                    onChange={(e) => setAgingConfig({ ...agingConfig, fresh: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100px' }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days or less</span>
                            </div>
                        </div>
                        <div className="form-group mb-0">
                            <label>🟡 Warm (Yellow)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    value={agingConfig.warm}
                                    onChange={(e) => setAgingConfig({ ...agingConfig, warm: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100px' }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days or less</span>
                            </div>
                        </div>
                        <div className="form-group mb-0">
                            <label>🟠 Aging (Orange)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <input
                                    type="number"
                                    min="0"
                                    value={agingConfig.aging}
                                    onChange={(e) => setAgingConfig({ ...agingConfig, aging: parseInt(e.target.value) || 0 })}
                                    style={{ width: '100px' }}
                                />
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>days or less</span>
                            </div>
                        </div>
                        <div className="form-group mb-0">
                            <label>🔴 Stale (Red)</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>More than {agingConfig.aging} days</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lead Sources Section */}
            <div className="settings-grid-2">
                <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <SectionHeader
                        icon="ri-share-line"
                        title="Lead Sources"
                        subtitle="Manage where leads come from"
                        action={(
                            <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }} onClick={() => setShowSourceModal(true)}>
                                <i className="ri-add-line mr-1"></i> Add
                            </button>
                        )}
                    />
                    <div className="flex flex-col gap-3" style={{ padding: '1.5rem' }}>
                        {leadSources.map(source => (
                            <CategoryCard
                                key={source.id}
                                {...source}
                                onToggle={() => toggleSource(source.id)}
                                onEdit={() => handleEditSource(source)}
                            />
                        ))}
                    </div>
                </div>
                <div></div>
            </div>


            <div className="flex justify-end pt-4">
                <button className="btn btn-primary" style={{ padding: '0.75rem 2.5rem' }} onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <><i className="ri-loader-4-line spin mr-2"></i> Saving...</>
                    ) : (
                        <><i className="ri-save-line mr-2"></i> Save Lead Configuration</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default LeadSettings;
