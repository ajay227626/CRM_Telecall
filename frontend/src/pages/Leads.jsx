import React, { useState, useEffect } from 'react';
import { getLeads, deleteLead, deleteMultipleLeads, getSettings } from '../utils/api';
import { exportToCSV } from '../utils/exportUtils';
import AddLeadModal from '../components/Leads/AddLeadModal';
import BulkUploadModal from '../components/Leads/BulkUploadModal';
import ConfirmationModal from '../components/Shared/ConfirmationModal';
import { usePermissions } from '../hooks/usePermissions';
import { useCall } from '../context/CallContext';

const Leads = () => {
    const { hasPermission } = usePermissions();
    const { initiateCallWithLead } = useCall();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [selectedLeads, setSelectedLeads] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [editingLead, setEditingLead] = useState(null);
    const [toast, setToast] = useState(null);
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });
    const [privacySettings, setPrivacySettings] = useState({
        maskedParams: { nameMasking: false },
        privacyControls: { showMobile: true, showEmail: true, showAddress: true, allowDirectCall: true, allowWhatsApp: true, allowEmailing: true }
    });

    const categories = ['Real Estate', 'Construction', 'Insurance', 'Education', 'Other'];
    const statuses = ['New', 'Contacted', 'Qualified', 'Converted', 'Lost'];

    const renderHeader = () => (
        <div className="dashboard-header">
            <div className="header-left">
                <h1>Leads Management</h1>
                <p>Manage and track your sales leads effectively.</p>
            </div>
            <div className="header-right">
                {hasPermission('leads', 'edit') && (
                    <button className="btn btn-secondary" onClick={() => setShowBulkModal(true)}>
                        <i className="ri-upload-2-line mr-2"></i> Bulk Upload
                    </button>
                )}
                {hasPermission('leads', 'edit') && (
                    <button className="btn btn-primary" onClick={() => { setEditingLead(null); setShowAddModal(true); }}>
                        <i className="ri-add-line mr-2"></i> Add Lead
                    </button>
                )}
                {hasPermission('leads', 'view') && (
                    <button className="btn btn-secondary" onClick={handleExport}>
                        <i className="ri-download-line mr-2"></i> Export
                    </button>
                )}
            </div>
        </div>
    );

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        loadLeads();
    }, [search, statusFilter, categoryFilter]);

    const loadSettings = async () => {
        try {
            const data = await getSettings('calling');
            if (data) {
                setPrivacySettings({
                    maskedParams: data.maskedParams || { nameMasking: false },
                    privacyControls: data.privacyControls || privacySettings.privacyControls
                });
            }
        } catch (err) {
            console.error('Failed to load privacy settings:', err);
        }
    };

    const loadLeads = async () => {
        try {
            setLoading(true);
            const params = {};
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;
            if (categoryFilter !== 'all') params.category = categoryFilter;

            const data = await getLeads(params);
            setLeads(data);
        } catch (err) {
            showToast('Failed to load leads', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteLead = async (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Lead',
            message: 'Are you sure you want to delete this lead? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteLead(id);
                    setLeads(prev => prev.filter(l => l._id !== id));
                    showToast('Lead deleted', 'success');
                } catch (err) {
                    showToast('Failed to delete lead', 'error');
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleBulkDelete = async () => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Multiple Leads',
            message: `Are you sure you want to delete ${selectedLeads.length} leads? This action cannot be undone.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteMultipleLeads(selectedLeads);
                    setLeads(prev => prev.filter(l => !selectedLeads.includes(l._id)));
                    setSelectedLeads([]);
                    showToast(`${selectedLeads.length} leads deleted`, 'success');
                } catch (err) {
                    showToast('Failed to delete leads', 'error');
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleExport = () => {
        if (!leads.length) {
            showToast('No leads to export', 'error');
            return;
        }
        // Prepare data for export, applying masking if active
        // Ideally export should be raw if admin, but here client side export respects view
        const dataToExport = leads.map(lead => ({
            Name: maskName(lead.name, lead._id),
            Phone: maskPhone(lead.phone),
            Email: maskEmail(lead.email),
            Category: lead.category,
            Status: lead.status,
            Source: lead.source,
            AssignedTo: lead.assignedTo || 'Unassigned',
            FollowUp: formatDate(lead.followUpDate)
        }));
        exportToCSV(dataToExport, `leads_export_${new Date().toISOString().split('T')[0]}`);
        showToast('Leads exported successfully', 'success');
    };

    const toggleSelectAll = () => {
        if (selectedLeads.length === leads.length) {
            setSelectedLeads([]);
        } else {
            setSelectedLeads(leads.map(l => l._id));
        }
    };

    const toggleSelect = (id) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(prev => prev.filter(i => i !== id));
        } else {
            setSelectedLeads(prev => [...prev, id]);
        }
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const getCategoryBadge = (category) => {
        const colors = {
            'Real Estate': { bg: '#D1FAE5', text: '#047857', icon: 'ri-building-line' },
            'Construction': { bg: '#FEF3C7', text: '#92400E', icon: 'ri-hammer-line' },
            'Insurance': { bg: '#DBEAFE', text: '#1E40AF', icon: 'ri-shield-check-line' },
            'Education': { bg: '#F3E8FF', text: '#7E22CE', icon: 'ri-book-open-line' },
            'Other': { bg: '#F3F4F6', text: '#374151', icon: 'ri-more-fill' }
        };
        const color = colors[category] || colors['Other'];
        return (
            <span className="category-badge" style={{ backgroundColor: color.bg, color: color.text }}>
                <i className={`${color.icon} mr-1`}></i> {category}
            </span>
        );
    };

    const getStatusBadge = (status) => {
        const colors = {
            'New': { bg: '#F3F4F6', text: '#374151', icon: 'ri-star-line' },
            'Contacted': { bg: '#DBEAFE', text: '#1E40AF', icon: 'ri-phone-line' },
            'Qualified': { bg: '#FEF3C7', text: '#92400E', icon: 'ri-checkbox-circle-line' },
            'Converted': { bg: '#D1FAE5', text: '#047857', icon: 'ri-trophy-line' },
            'Lost': { bg: '#FEE2E2', text: '#DC2626', icon: 'ri-close-circle-line' }
        };
        const color = colors[status] || colors['New'];
        return (
            <span className="status-badge" style={{ backgroundColor: color.bg, color: color.text }}>
                <i className={`${color.icon} mr-1`}></i> {status}
            </span>
        );
    };

    const formatDate = (date) => {
        if (!date) return 'Not set';
        return new Date(date).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
    };

    // Data Masking Helpers
    const maskName = (name, id) => {
        if (privacySettings.maskedParams.nameMasking) {
            return `Lead-${id.substring(id.length - 6).toUpperCase()}`;
        }
        return name;
    };

    const maskPhone = (phone) => {
        if (!privacySettings.privacyControls.showMobile) {
            return '••••••' + phone.substring(phone.length - 4);
        }
        return phone;
    };

    const maskEmail = (email) => {
        if (!privacySettings.privacyControls.showEmail || !email) {
            return '••••@••••.com';
        }
        return email;
    };

    const getStatusColor = (status) => {
        const colors = {
            'New': '#6366f1',
            'Contacted': '#3b82f6',
            'Qualified': '#f59e0b',
            'Converted': '#10b981',
            'Lost': '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const renderCardView = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {leads.map(lead => {
                const statusColor = getStatusColor(lead.status);
                return (
                    <div
                        key={lead._id}
                        style={{
                            background: 'var(--bg-card)',
                            borderRadius: '1rem',
                            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                            overflow: 'hidden',
                            borderLeft: `4px solid ${statusColor}`,
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
                            background: `linear-gradient(135deg, ${statusColor}15 0%, transparent 100%)`,
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
                                    background: statusColor,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white',
                                    fontWeight: '700',
                                    fontSize: '1.125rem',
                                    boxShadow: `0 4px 12px ${statusColor}40`
                                }}>
                                    {lead.name.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <h3 style={{
                                        fontWeight: '700',
                                        color: '#1f2937',
                                        fontSize: '1rem',
                                        marginBottom: '2px'
                                    }}>
                                        {maskName(lead.name, lead._id)}
                                    </h3>
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: '#6b7280',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}>
                                        <i className="ri-global-line"></i> {lead.source}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <button
                                    onClick={() => { setEditingLead(lead); setShowAddModal(true); }}
                                    style={{
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: 'var(--bg-hover)',
                                        color: 'var(--text-secondary)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s'
                                    }}
                                    title="Edit"
                                >
                                    <i className="ri-edit-line"></i>
                                </button>
                                <input
                                    type="checkbox"
                                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: statusColor }}
                                    checked={selectedLeads.includes(lead._id)}
                                    onChange={() => toggleSelect(lead._id)}
                                />
                            </div>
                        </div>

                        {/* Card Body */}
                        <div style={{ padding: '1rem 1.25rem' }}>
                            {/* Contact Info */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: '#dcfce7',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#16a34a'
                                    }}>
                                        <i className="ri-phone-fill" style={{ fontSize: '0.875rem' }}></i>
                                    </div>
                                    <span style={{ fontWeight: '500', color: '#1f2937', fontSize: '0.875rem' }}>
                                        {maskPhone(lead.phone)}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '6px',
                                        background: '#dbeafe',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: '#2563eb'
                                    }}>
                                        <i className="ri-mail-fill" style={{ fontSize: '0.875rem' }}></i>
                                    </div>
                                    <span style={{ color: '#6b7280', fontSize: '0.875rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                        {maskEmail(lead.email)}
                                    </span>
                                </div>
                            </div>

                            {/* Badges */}
                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                                {getCategoryBadge(lead.category)}
                                {getStatusBadge(lead.status)}
                            </div>
                        </div>

                        {/* Card Footer */}
                        <div style={{
                            padding: '0.875rem 1.25rem',
                            background: 'var(--bg-main)',
                            borderTop: '1px solid var(--border)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <i className="ri-calendar-event-line"></i> Follow-up
                                </div>
                                <div style={{ fontWeight: '600', color: '#374151', fontSize: '0.875rem' }}>
                                    {formatDate(lead.followUpDate)}
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {privacySettings.privacyControls.allowDirectCall && (
                                    <button
                                        onClick={() => initiateCallWithLead(lead, 'Direct')}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: '#dcfce7',
                                            color: '#16a34a',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1rem',
                                            transition: 'transform 0.15s'
                                        }} title="Call">
                                        <i className="ri-phone-line"></i>
                                    </button>
                                )}
                                {privacySettings.privacyControls.allowWhatsApp && (
                                    <button style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#d1fae5',
                                        color: '#059669',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        transition: 'transform 0.15s'
                                    }} title="WhatsApp">
                                        <i className="ri-whatsapp-line"></i>
                                    </button>
                                )}
                                {privacySettings.privacyControls.allowEmailing && (
                                    <button style={{
                                        width: '36px',
                                        height: '36px',
                                        borderRadius: '10px',
                                        border: 'none',
                                        background: '#dbeafe',
                                        color: '#2563eb',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '1rem',
                                        transition: 'transform 0.15s'
                                    }} title="Email">
                                        <i className="ri-mail-line"></i>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );

    return (
        <div className="leads-page flex flex-col gap-6">
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                    {toast.message}
                </div>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddLeadModal
                    lead={editingLead}
                    onClose={() => { setShowAddModal(false); setEditingLead(null); }}
                    onSave={loadLeads}
                />
            )}
            {showBulkModal && (
                <BulkUploadModal
                    onClose={() => setShowBulkModal(false)}
                    onSuccess={loadLeads}
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
            />

            {/* Header */}
            {renderHeader()}

            {/* Filters & Search Bar - Uses Brand Accent Color */}
            <div style={{
                background: 'var(--primary)',
                padding: '0.875rem 1.25rem',
                borderRadius: '0.875rem',
                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)'
            }}>
                <div style={{ display: 'flex', flexWrap: 'nowrap', gap: '0.75rem', alignItems: 'center' }}>
                    {/* Search Input */}
                    <div style={{ position: 'relative', flex: '1 1 auto', minWidth: '120px' }}>
                        <i className="ri-search-line" style={{
                            position: 'absolute',
                            left: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: 'var(--primary)',
                            fontSize: '1rem'
                        }}></i>
                        <input
                            type="text"
                            placeholder="Search leads..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.625rem 0.75rem 0.625rem 2.25rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: 'white',
                                fontSize: '0.875rem',
                                color: '#1f2937',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    {/* Status Filter */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        style={{
                            padding: '0.625rem 2rem 0.625rem 0.875rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'white',
                            fontSize: '0.875rem',
                            color: '#1f2937',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            flexShrink: 0,
                            width: '130px',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1rem'
                        }}
                    >
                        <option value="all">All Status</option>
                        {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>

                    {/* Category Filter */}
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                            padding: '0.625rem 2rem 0.625rem 0.875rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'white',
                            fontSize: '0.875rem',
                            color: '#1f2937',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            flexShrink: 0,
                            width: '150px',
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%236b7280\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 0.5rem center',
                            backgroundSize: '1rem'
                        }}
                    >
                        <option value="all">All Categories</option>
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>

                    {/* View Mode Toggle */}
                    <div style={{
                        display: 'flex',
                        gap: '0.25rem',
                        background: 'rgba(255, 255, 255, 0.25)',
                        padding: '0.25rem',
                        borderRadius: '0.5rem',
                        flexShrink: 0
                    }}>
                        <button
                            onClick={() => setViewMode('table')}
                            style={{
                                padding: '0.5rem 0.625rem',
                                borderRadius: '0.375rem',
                                border: 'none',
                                background: viewMode === 'table' ? 'white' : 'transparent',
                                color: viewMode === 'table' ? 'var(--primary)' : 'white',
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
                                color: viewMode === 'card' ? 'var(--primary)' : 'white',
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

            {/* Bulk Actions */}
            {selectedLeads.length > 0 && hasPermission('leads', 'delete') && (
                <div className="bg-red-50 border border-red-100 p-3 rounded-lg flex justify-between items-center text-red-700 animate-fadeIn">
                    <span className="font-medium flex items-center gap-2">
                        <i className="ri-checkbox-multiple-line"></i>
                        {selectedLeads.length} leads selected
                    </span>
                    <button className="text-sm font-bold hover:underline flex items-center gap-1" onClick={handleBulkDelete}>
                        <i className="ri-delete-bin-line"></i> Delete Selected
                    </button>
                </div>
            )}

            {/* Content */}
            <div className="flex-1">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-64 text-secondary">
                        <i className="ri-loader-4-line spin text-3xl mb-3 text-primary"></i>
                        <span>Loading your leads...</span>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-secondary bg-white rounded-xl border border-dashed border-gray-300">
                        <i className="ri-inbox-line text-4xl mb-3 text-gray-300"></i>
                        <p>No leads found. Add your first lead to get started.</p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'table' ? (
                            <div style={{
                                background: 'var(--bg-card)',
                                borderRadius: '1rem',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                                overflow: 'hidden'
                            }}>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{
                                                background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 85%, white) 0%, color-mix(in srgb, var(--primary) 70%, white) 100%)',
                                                color: '#1f2937'
                                            }}>
                                                <th style={{ padding: '1rem', width: '50px' }}>
                                                    <input
                                                        type="checkbox"
                                                        style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: 'white' }}
                                                        checked={selectedLeads.length === leads.length && leads.length > 0}
                                                        onChange={toggleSelectAll}
                                                    />
                                                </th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead</th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Owner</th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Follow Up</th>
                                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {leads.map((lead, index) => {
                                                const statusColor = getStatusColor(lead.status);
                                                return (
                                                    <tr
                                                        key={lead._id}
                                                        style={{
                                                            borderBottom: '1px solid #f3f4f6',
                                                            background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                                                            transition: 'background 0.15s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)'}
                                                    >
                                                        <td style={{ padding: '1rem', borderLeft: `4px solid ${statusColor}` }}>
                                                            <input
                                                                type="checkbox"
                                                                style={{ cursor: 'pointer', width: '18px', height: '18px', accentColor: statusColor }}
                                                                checked={selectedLeads.includes(lead._id)}
                                                                onChange={() => toggleSelect(lead._id)}
                                                            />
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div style={{
                                                                    width: '40px',
                                                                    height: '40px',
                                                                    borderRadius: '10px',
                                                                    background: statusColor,
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    justifyContent: 'center',
                                                                    color: 'white',
                                                                    fontWeight: '700',
                                                                    fontSize: '1rem',
                                                                    boxShadow: `0 3px 8px ${statusColor}40`
                                                                }}>
                                                                    {lead.name.charAt(0).toUpperCase()}
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{maskName(lead.name, lead._id)}</div>
                                                                    <div style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                        <i className="ri-global-line"></i> {lead.source}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                                                                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                                    <i className="ri-phone-fill" style={{ color: '#16a34a', fontSize: '0.75rem' }}></i>
                                                                    {maskPhone(lead.phone)}
                                                                </div>
                                                                <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                                                                    <i className="ri-mail-fill" style={{ color: '#3b82f6', fontSize: '0.75rem' }}></i>
                                                                    {maskEmail(lead.email)}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>{getCategoryBadge(lead.category)}</td>
                                                        <td style={{ padding: '1rem' }}>{getStatusBadge(lead.status)}</td>
                                                        <td style={{ padding: '1rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                                                            {lead.assignedTo || <span style={{ color: '#9ca3af', fontStyle: 'italic' }}>Unassigned</span>}
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                                                <i className="ri-calendar-line" style={{ color: '#f59e0b' }}></i>
                                                                {formatDate(lead.followUpDate)}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1rem' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                                {privacySettings.privacyControls.allowDirectCall && (
                                                                    <button
                                                                        onClick={() => initiateCallWithLead(lead, 'Direct')}
                                                                        style={{
                                                                            width: '32px',
                                                                            height: '32px',
                                                                            borderRadius: '8px',
                                                                            border: 'none',
                                                                            background: '#dcfce7',
                                                                            color: '#16a34a',
                                                                            cursor: 'pointer',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            justifyContent: 'center'
                                                                        }} title="Call">
                                                                        <i className="ri-phone-line"></i>
                                                                    </button>
                                                                )}
                                                                {privacySettings.privacyControls.allowEmailing && (
                                                                    <button style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: '#dbeafe',
                                                                        color: '#2563eb',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }} title="Email">
                                                                        <i className="ri-mail-line"></i>
                                                                    </button>
                                                                )}
                                                                {privacySettings.privacyControls.allowWhatsApp && (
                                                                    <button style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: '#d1fae5',
                                                                        color: '#059669',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }} title="WhatsApp">
                                                                        <i className="ri-whatsapp-line"></i>
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => { setEditingLead(lead); setShowAddModal(true); }}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        borderRadius: '8px',
                                                                        border: 'none',
                                                                        background: 'var(--bg-hover)',
                                                                        color: 'var(--text-secondary)',
                                                                        cursor: 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                    title="Edit"
                                                                >
                                                                    <i className="ri-edit-line"></i>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : renderCardView()}
                    </>
                )}
            </div>
        </div >
    );
};

export default Leads;
