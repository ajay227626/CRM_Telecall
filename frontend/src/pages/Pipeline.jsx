import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLeads, updateLead, getEffectiveSettings } from '../utils/api';
import { getUser } from '../utils/permissions';
import { useCall } from '../context/CallContext';

const Pipeline = () => {
    const navigate = useNavigate();
    const { initiateCallWithLead } = useCall();
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [statuses, setStatuses] = useState([
        { id: 1, name: 'New', color: '#6b7280' },
        { id: 2, name: 'Contacted', color: '#3b82f6' },
        { id: 3, name: 'Qualified', color: '#f59e0b' },
        { id: 4, name: 'Converted', color: '#10b981' },
        { id: 5, name: 'Lost', color: '#ef4444' }
    ]);
    const [categories, setCategories] = useState([]);
    const [categoryFilter, setCategoryFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [draggedLead, setDraggedLead] = useState(null);
    const [toast, setToast] = useState(null);

    // Aging configuration (days)
    const [agingConfig, setAgingConfig] = useState({
        fresh: 2,
        warm: 5,
        aging: 10
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [leadsData, settingsData] = await Promise.all([
                getLeads(),
                getEffectiveSettings(getUser()?.id, 'leads').catch(() => null)
            ]);
            setLeads(leadsData);

            if (settingsData?.config) {
                if (settingsData.config.statuses) {
                    setStatuses(settingsData.config.statuses.filter(s => s.status === 'Active'));
                }
                if (settingsData.config.categories) {
                    setCategories(settingsData.config.categories.filter(c => c.status === 'Active'));
                }
                if (settingsData.config.agingConfig) {
                    setAgingConfig(settingsData.config.agingConfig);
                }
            }
        } catch (err) {
            console.error('Failed to load pipeline data:', err);
        } finally {
            setLoading(false);
        }
    };

    const getAgingColor = (lead) => {
        const now = new Date();
        const statusDate = new Date(lead.statusChangedAt || lead.createdAt);
        const daysDiff = Math.floor((now - statusDate) / (1000 * 60 * 60 * 24));

        if (daysDiff <= agingConfig.fresh) {
            return {
                gradient: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                color: '#059669',
                bg: '#ecfdf5',
                label: 'Fresh',
                icon: 'ri-leaf-line',
                days: daysDiff
            };
        }
        if (daysDiff <= agingConfig.warm) {
            return {
                gradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                color: '#d97706',
                bg: '#fef9e7',
                label: 'Warm',
                icon: 'ri-fire-line',
                days: daysDiff
            };
        }
        if (daysDiff <= agingConfig.aging) {
            return {
                gradient: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                color: '#ea580c',
                bg: '#fff7ed',
                label: 'Aging',
                icon: 'ri-time-line',
                days: daysDiff
            };
        }
        return {
            gradient: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
            color: '#dc2626',
            bg: '#fef2f2',
            label: 'Stale',
            icon: 'ri-alert-line',
            days: daysDiff
        };
    };

    const getLeadsByStatus = (statusName) => {
        let filtered = leads.filter(lead => lead.status === statusName);
        if (categoryFilter !== 'all') {
            filtered = filtered.filter(lead => lead.category === categoryFilter);
        }
        if (sourceFilter !== 'all') {
            filtered = filtered.filter(lead => lead.source === sourceFilter);
        }
        return filtered;
    };

    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e, newStatus) => {
        e.preventDefault();
        if (!draggedLead || draggedLead.status === newStatus) {
            setDraggedLead(null);
            return;
        }

        try {
            await updateLead(draggedLead._id, { status: newStatus });
            setLeads(prev => prev.map(lead =>
                lead._id === draggedLead._id
                    ? { ...lead, status: newStatus, statusChangedAt: new Date().toISOString() }
                    : lead
            ));
            showToast(`Lead moved to ${newStatus}`, 'success');
        } catch (err) {
            showToast('Failed to update lead status', 'error');
        }
        setDraggedLead(null);
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const sources = ['Website', 'Referral', 'Cold Call', 'Social Media', 'Other'];

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '60vh',
                gap: '1rem'
            }}>
                <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <span style={{ fontSize: '1.125rem', color: 'var(--text-secondary)' }}>Loading pipeline...</span>
            </div>
        );
    }

    return (
        <div style={{ padding: '0' }}>
            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed',
                    top: '1rem',
                    right: '1rem',
                    padding: '1rem 1.5rem',
                    borderRadius: '0.5rem',
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    fontWeight: '600',
                    zIndex: 1000,
                    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                }}>
                    <i className={toast.type === 'success' ? 'ri-check-line' : 'ri-error-warning-line'}></i>
                    {toast.message}
                </div>
            )}

            {/* Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, #000) 100%)',
                borderRadius: '1rem',
                padding: '1.5rem 2rem',
                marginBottom: '1.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className="ri-kanban-view" style={{ fontSize: '24px', color: 'white' }}></i>
                    </div>
                    <div>
                        <h1 style={{ margin: 0, color: 'white', fontSize: '1.5rem', fontWeight: '700' }}>Lead Pipeline</h1>
                        <p style={{ margin: '0.25rem 0 0', color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>
                            {leads.length} leads • Drag & drop to update status
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all" style={{ color: '#333' }}>All Categories</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.name} style={{ color: '#333' }}>{c.name}</option>
                        ))}
                    </select>

                    <select
                        value={sourceFilter}
                        onChange={(e) => setSourceFilter(e.target.value)}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}
                    >
                        <option value="all" style={{ color: '#333' }}>All Sources</option>
                        {sources.map(s => (
                            <option key={s} value={s} style={{ color: '#333' }}>{s}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => navigate('/leads')}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'rgba(255,255,255,0.2)',
                            color: 'white',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <i className="ri-list-check"></i> List View
                    </button>
                </div>
            </div>

            {/* Aging Legend */}
            <div style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1rem',
                padding: '1rem',
                background: 'var(--bg-card)',
                borderRadius: '0.75rem',
                fontSize: '0.8125rem',
                alignItems: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>Lead Age:</span>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-leaf-line" style={{ fontSize: '14px', color: '#059669' }}></i>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>Fresh (0-{agingConfig.fresh}d)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-fire-line" style={{ fontSize: '14px', color: '#d97706' }}></i>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>Warm ({agingConfig.fresh + 1}-{agingConfig.warm}d)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #fed7aa 0%, #fdba74 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-time-line" style={{ fontSize: '14px', color: '#ea580c' }}></i>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>Aging ({agingConfig.warm + 1}-{agingConfig.aging}d)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                        <div style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '6px',
                            background: 'linear-gradient(135deg, #fecaca 0%, #fca5a5 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-alert-line" style={{ fontSize: '14px', color: '#dc2626' }}></i>
                        </div>
                        <span style={{ color: 'var(--text-secondary)' }}>Stale ({agingConfig.aging}+d)</span>
                    </div>
                </div>
            </div>

            {/* Kanban Columns */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${statuses.length}, 1fr)`,
                gap: '1rem',
                minHeight: '60vh'
            }}>
                {statuses.map(status => {
                    const statusLeads = getLeadsByStatus(status.name);
                    return (
                        <div
                            key={status.id}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, status.name)}
                            style={{
                                background: 'var(--bg-card)',
                                borderRadius: '0.75rem',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'column',
                                border: draggedLead ? '2px dashed var(--border)' : '1px solid var(--border)'
                            }}
                        >
                            {/* Column Header */}
                            <div style={{
                                padding: '1rem',
                                borderBottom: '1px solid var(--border)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{
                                        width: '12px',
                                        height: '12px',
                                        borderRadius: '50%',
                                        background: status.color
                                    }}></div>
                                    <span style={{ fontWeight: '700', color: 'var(--text-main)' }}>{status.name}</span>
                                </div>
                                <span style={{
                                    background: 'var(--bg-hover)',
                                    padding: '0.25rem 0.625rem',
                                    borderRadius: '1rem',
                                    fontSize: '0.75rem',
                                    fontWeight: '600',
                                    color: 'var(--text-secondary)'
                                }}>
                                    {statusLeads.length}
                                </span>
                            </div>

                            {/* Cards Container */}
                            <div style={{
                                flex: 1,
                                padding: '0.75rem',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '0.5rem',
                                overflowY: 'auto',
                                minHeight: '200px'
                            }}>
                                {statusLeads.length === 0 ? (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '2rem 1rem',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.875rem'
                                    }}>
                                        No leads
                                    </div>
                                ) : (
                                    statusLeads.map(lead => {
                                        const aging = getAgingColor(lead);
                                        return (
                                            <div
                                                key={lead._id}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, lead)}
                                                style={{
                                                    background: aging.gradient,
                                                    border: 'none',
                                                    borderRadius: '0.625rem',
                                                    padding: '0.875rem',
                                                    cursor: 'grab',
                                                    transition: 'all 0.2s',
                                                    position: 'relative',
                                                    overflow: 'hidden'
                                                }}
                                                onMouseEnter={(e) => {
                                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                                }}
                                                onMouseLeave={(e) => {
                                                    e.currentTarget.style.boxShadow = 'none';
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                }}
                                            >
                                                {/* Lead Name & Age */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '0.5rem' }}>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                                                            {lead.name}
                                                        </div>
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.25rem',
                                                            padding: '0.125rem 0.5rem',
                                                            borderRadius: '4px',
                                                            background: aging.bg,
                                                            fontSize: '0.6875rem',
                                                            color: aging.color,
                                                            fontWeight: '600'
                                                        }}>
                                                            <i className={aging.icon} style={{ fontSize: '11px' }}></i>
                                                            <span>{aging.label} • {aging.days}d</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Category */}
                                                <div style={{
                                                    fontSize: '0.75rem',
                                                    color: 'var(--text-secondary)',
                                                    marginBottom: '0.375rem'
                                                }}>
                                                    {lead.category}
                                                </div>

                                                {/* Phone & Actions */}
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                                        {lead.phone}
                                                    </span>
                                                    <div style={{ display: 'flex', gap: '0.25rem' }}>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                initiateCallWithLead(lead, 'Direct');
                                                            }}
                                                            style={{
                                                                width: '24px',
                                                                height: '24px',
                                                                borderRadius: '4px',
                                                                border: 'none',
                                                                background: '#dcfce7',
                                                                color: '#16a34a',
                                                                cursor: 'pointer',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                justifyContent: 'center',
                                                                fontSize: '0.75rem'
                                                            }}
                                                            title="Call"
                                                        >
                                                            <i className="ri-phone-line"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pipeline;
