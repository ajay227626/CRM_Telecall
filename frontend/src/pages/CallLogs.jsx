import React, { useState, useEffect } from 'react';
import { getCallLogs, getCallStats, getLeads, initiateCall } from '../utils/api';
import { exportToCSV } from '../utils/exportUtils';
import MakeCallModal from '../components/CallLogs/MakeCallModal';
import CallDetailsModal from '../components/CallLogs/CallDetailsModal';
import { usePermissions } from '../hooks/usePermissions';
import { useCall } from '../context/CallContext';

const CallLogs = () => {
    const { hasPermission } = usePermissions();
    const { toggleDialer } = useCall();
    const [callLogs, setCallLogs] = useState([]);
    const [stats, setStats] = useState({ totalCalls: 0, completedCalls: 0, avgDuration: '0:00', avgScore: 0 });
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [viewMode, setViewMode] = useState('table'); // 'table' or 'card'
    const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
    const [showMakeCallModal, setShowMakeCallModal] = useState(false);
    const [selectedCall, setSelectedCall] = useState(null);
    const [toast, setToast] = useState(null);

    // Listened recordings tracking
    const [listenedRecordings, setListenedRecordings] = useState(() => {
        const saved = localStorage.getItem('listenedRecordings');
        return saved ? JSON.parse(saved) : [];
    });
    const [showOnlyListened, setShowOnlyListened] = useState(false);

    const statuses = ['initiated', 'ringing', 'completed', 'no answer', 'busy', 'failed'];

    useEffect(() => {
        loadStats();
    }, []);

    useEffect(() => {
        loadCallLogs();
    }, [search, statusFilter, pagination.page]);

    const loadStats = async () => {
        try {
            const data = await getCallStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load stats');
        }
    };

    const loadCallLogs = async () => {
        try {
            setLoading(true);
            const params = { page: pagination.page, limit: pagination.limit };
            if (search) params.search = search;
            if (statusFilter !== 'all') params.status = statusFilter;

            const data = await getCallLogs(params);
            setCallLogs(data.callLogs);
            setPagination(prev => ({ ...prev, ...data.pagination }));
        } catch (err) {
            showToast('Failed to load call logs', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCallInitiated = () => {
        loadCallLogs();
        loadStats();
        setShowMakeCallModal(false);
        showToast('Call initiated successfully!', 'success');
    };

    const handleExport = () => {
        if (!callLogs.length) {
            showToast('No call logs to export', 'error');
            return;
        }
        const dataToExport = callLogs.map(log => ({
            Lead: log.leadName,
            Caller: log.caller,
            Time: formatTime(log.callTime),
            Duration: formatDuration(log.duration),
            Status: log.status,
            CallType: log.callType,
            AIScore: log.aiScore || 'N/A'
        }));
        exportToCSV(dataToExport, `call_logs_export_${new Date().toISOString().split('T')[0]}`);
        showToast('Call logs exported successfully', 'success');
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const markAsListened = (callId) => {
        if (!listenedRecordings.includes(callId)) {
            const updated = [...listenedRecordings, callId];
            setListenedRecordings(updated);
            localStorage.setItem('listenedRecordings', JSON.stringify(updated));
        }
    };

    const isListened = (callId) => listenedRecordings.includes(callId);

    const getFilteredCallLogs = () => {
        if (showOnlyListened) {
            return callLogs.filter(log => listenedRecordings.includes(log._id));
        }
        return callLogs;
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const formatTime = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleString('en-CA', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', hour12: false
        }).replace(',', '');
    };

    const getStatusBadge = (status) => {
        const colors = {
            'initiated': { bg: '#DBEAFE', text: '#1E40AF', icon: 'ri-phone-fill' },
            'ringing': { bg: '#FEF3C7', text: '#92400E', icon: 'ri-notification-3-line' },
            'completed': { bg: '#D1FAE5', text: '#047857', icon: 'ri-check-double-line' },
            'no answer': { bg: '#FEE2E2', text: '#DC2626', icon: 'ri-phone-off-line' },
            'busy': { bg: '#FEF3C7', text: '#92400E', icon: 'ri-timer-line' },
            'failed': { bg: '#FEE2E2', text: '#DC2626', icon: 'ri-close-circle-line' }
        };
        const color = colors[status] || colors['initiated'];
        return (
            <span className="status-badge" style={{ backgroundColor: color.bg, color: color.text }}>
                <i className={`${color.icon} mr-1`}></i> {status}
            </span>
        );
    };

    const getCallTypeBadge = (type, maskedNumber) => {
        if (type === 'Masked') {
            return (
                <div className="flex items-center gap-2 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100">
                    <i className="ri-shield-star-line"></i>
                    <span>Masked</span>
                    {maskedNumber && <span className="font-mono ml-1 hidden sm:inline">{maskedNumber}</span>}
                </div>
            );
        } else if (type === 'Direct') {
            return (
                <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                    <i className="ri-phone-line"></i>
                    <span>Direct</span>
                </div>
            );
        } else if (type === 'WhatsApp') {
            return (
                <div className="flex items-center gap-2 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full border border-green-100">
                    <i className="ri-whatsapp-line"></i>
                    <span>WhatsApp</span>
                </div>
            );
        } else if (type === 'Email') {
            return (
                <div className="flex items-center gap-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full border border-blue-100">
                    <i className="ri-mail-line"></i>
                    <span>Email</span>
                </div>
            );
        }
        return null;
    };

    const renderStatsCards = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {/* Total Calls */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
                padding: '1.25rem',
                borderRadius: '1rem',
                borderLeft: '4px solid #3b82f6',
                boxShadow: '0 4px 12px rgba(59, 130, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Calls</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#1e40af', lineHeight: '1' }}>{stats.totalCalls}</p>
                </div>
                <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: '#3b82f6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                }}>
                    <i className="ri-phone-line" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
            </div>

            {/* Completed */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(16, 185, 129, 0.05) 100%)',
                padding: '1.25rem',
                borderRadius: '1rem',
                borderLeft: '4px solid #10b981',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Completed</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#047857', lineHeight: '1' }}>{stats.completedCalls}</p>
                </div>
                <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)'
                }}>
                    <i className="ri-check-double-line" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
            </div>

            {/* Avg Duration */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
                padding: '1.25rem',
                borderRadius: '1rem',
                borderLeft: '4px solid #f59e0b',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Duration</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#b45309', lineHeight: '1' }}>{stats.avgDuration}</p>
                </div>
                <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)'
                }}>
                    <i className="ri-time-line" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
            </div>

            {/* Avg Quality */}
            <div style={{
                background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
                padding: '1.25rem',
                borderRadius: '1rem',
                borderLeft: '4px solid #8b5cf6',
                boxShadow: '0 4px 12px rgba(139, 92, 246, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div>
                    <h3 style={{ fontSize: '0.8rem', fontWeight: '500', color: '#64748b', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Avg Quality</h3>
                    <p style={{ fontSize: '2rem', fontWeight: '800', color: '#6d28d9', lineHeight: '1' }}>{stats.avgScore}</p>
                </div>
                <div style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '12px',
                    background: '#8b5cf6',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
                }}>
                    <i className="ri-star-line" style={{ fontSize: '1.5rem', color: 'white' }}></i>
                </div>
            </div>
        </div>
    );

    const getStatusColor = (status) => {
        const colors = {
            'initiated': '#3b82f6',
            'ringing': '#f59e0b',
            'completed': '#10b981',
            'no answer': '#ef4444',
            'busy': '#f59e0b',
            'failed': '#ef4444'
        };
        return colors[status] || '#6b7280';
    };

    const renderTableView = () => (
        <div style={{
            background: 'var(--bg-card)',
            borderRadius: '1rem',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden'
        }}>
            {loading ? (
                <div className="flex flex-col items-center justify-center h-48 text-secondary">
                    <i className="ri-loader-4-line spin text-2xl mb-2 text-primary"></i>
                    <span>Loading call logs...</span>
                </div>
            ) : callLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-secondary">
                    <i className="ri-phone-line text-3xl mb-2 text-gray-300"></i>
                    <p>No call logs found. Make your first call!</p>
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{
                                background: 'linear-gradient(135deg, color-mix(in srgb, var(--primary) 85%, white) 0%, color-mix(in srgb, var(--primary) 70%, white) 100%)',
                                color: '#1f2937'
                            }}>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Lead</th>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Caller</th>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Duration</th>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AI Score</th>
                                <th style={{ padding: '1rem', fontWeight: '600', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {getFilteredCallLogs().map((log, index) => {
                                const statusColor = getStatusColor(log.status);
                                return (
                                    <tr
                                        key={log._id}
                                        style={{
                                            borderBottom: '1px solid #f3f4f6',
                                            background: index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)',
                                            transition: 'background 0.15s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'var(--bg-card)' : 'var(--bg-hover)'}
                                    >
                                        <td style={{ padding: '1rem', borderLeft: `4px solid ${statusColor}` }}>
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
                                                    {log.leadName.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '600', color: '#1f2937', fontSize: '0.9rem' }}>{log.leadName}</div>
                                                    {getCallTypeBadge(log.callType, log.maskedNumber)}
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', fontWeight: '500', color: '#374151' }}>{log.caller}</td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{ fontSize: '0.875rem', color: '#6b7280', fontFamily: 'monospace' }}>
                                                {formatTime(log.callTime)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <span style={{
                                                fontFamily: 'monospace',
                                                fontSize: '0.875rem',
                                                background: 'var(--bg-hover)',
                                                padding: '0.25rem 0.5rem',
                                                borderRadius: '4px',
                                                color: 'var(--text-main)'
                                            }}>
                                                {formatDuration(log.duration)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem' }}>{getStatusBadge(log.status)}</td>
                                        <td style={{ padding: '1rem' }}>
                                            {log.aiScore ? (
                                                <div style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.25rem',
                                                    background: '#fef3c7',
                                                    padding: '0.25rem 0.625rem',
                                                    borderRadius: '6px',
                                                    width: 'fit-content'
                                                }}>
                                                    <i className="ri-star-fill" style={{ color: '#f59e0b' }}></i>
                                                    <span style={{ fontWeight: '700', color: '#92400e' }}>{log.aiScore}/10</span>
                                                </div>
                                            ) : (
                                                <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.875rem' }}>N/A</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                                                {log.recordingUrl && (
                                                    <button
                                                        onClick={() => markAsListened(log._id)}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '8px',
                                                            border: isListened(log._id) ? '2px solid #10b981' : 'none',
                                                            background: isListened(log._id) ? '#d1fae5' : '#fce7f3',
                                                            color: isListened(log._id) ? '#10b981' : '#db2777',
                                                            cursor: 'pointer',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            position: 'relative'
                                                        }}
                                                        title={isListened(log._id) ? "Listened - Play Again" : "Play Recording"}
                                                    >
                                                        <i className={isListened(log._id) ? "ri-check-double-line" : "ri-play-circle-line"}></i>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => setSelectedCall(log)}
                                                    style={{
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
                                                    }}
                                                    title="View Details"
                                                >
                                                    <i className="ri-eye-line"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    const renderCardView = () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
            {loading ? (
                <div className="col-span-full flex flex-col items-center justify-center h-48 text-secondary">
                    <i className="ri-loader-4-line spin text-2xl mb-2 text-primary"></i>
                    <span>Loading call logs...</span>
                </div>
            ) : callLogs.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center h-48 text-secondary bg-white rounded-xl border border-dashed border-gray-300">
                    <i className="ri-phone-line text-3xl mb-2 text-gray-300"></i>
                    <p>No call logs found. Make your first call!</p>
                </div>
            ) : (
                getFilteredCallLogs().map(log => {
                    const statusColor = getStatusColor(log.status);
                    return (
                        <div
                            key={log._id}
                            onClick={() => setSelectedCall(log)}
                            style={{
                                background: 'var(--bg-card)',
                                borderRadius: '1rem',
                                boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                                overflow: 'hidden',
                                borderLeft: `4px solid ${statusColor}`,
                                cursor: 'pointer',
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
                                        {log.leadName.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 style={{
                                            fontWeight: '700',
                                            color: '#1f2937',
                                            fontSize: '1rem',
                                            marginBottom: '2px'
                                        }}>
                                            {log.leadName}
                                        </h3>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#6b7280'
                                        }}>
                                            {log.caller}
                                        </span>
                                    </div>
                                </div>
                                {getStatusBadge(log.status)}
                            </div>

                            {/* Card Body */}
                            <div style={{ padding: '1rem 1.25rem' }}>
                                {/* Call Type */}
                                <div style={{ marginBottom: '0.75rem' }}>
                                    {getCallTypeBadge(log.callType, log.maskedNumber)}
                                </div>

                                {/* Time & Duration */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '0.75rem 0',
                                    borderTop: '1px solid #f3f4f6'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.875rem', color: '#6b7280' }}>
                                        <i className="ri-calendar-line" style={{ color: '#f59e0b' }}></i>
                                        {formatTime(log.callTime)}
                                    </div>
                                    <div style={{
                                        fontFamily: 'monospace',
                                        fontSize: '0.875rem',
                                        background: 'var(--bg-hover)',
                                        padding: '0.25rem 0.5rem',
                                        borderRadius: '4px',
                                        color: 'var(--text-main)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}>
                                        <i className="ri-timer-line"></i>
                                        {formatDuration(log.duration)}
                                    </div>
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
                                {log.aiScore ? (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        background: '#fef3c7',
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: '8px'
                                    }}>
                                        <i className="ri-star-fill" style={{ color: '#f59e0b' }}></i>
                                        <span style={{ fontWeight: '700', color: '#92400e', fontSize: '0.875rem' }}>{log.aiScore}/10</span>
                                    </div>
                                ) : (
                                    <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: '0.8rem' }}>No AI Score</span>
                                )}
                                {log.recordingUrl && (
                                    <button style={{
                                        padding: '0.375rem 0.75rem',
                                        borderRadius: '8px',
                                        border: 'none',
                                        background: '#fce7f3',
                                        color: '#db2777',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.375rem',
                                        fontSize: '0.8rem',
                                        fontWeight: '500'
                                    }}>
                                        <i className="ri-play-circle-line"></i> Play
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
    );

    const renderPagination = () => (
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-border shadow-sm">
            <span className="text-sm text-secondary">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} records
            </span>
            <div className="flex items-center gap-2">
                <button
                    className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={pagination.page === 1}
                    onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                >
                    <i className="ri-arrow-left-s-line"></i>
                </button>
                <span className="text-sm font-medium text-main min-w-[80px] text-center">Page {pagination.page} of {pagination.pages}</span>
                <button
                    className="p-2 rounded-lg border border-border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={pagination.page >= pagination.pages}
                    onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                >
                    <i className="ri-arrow-right-s-line"></i>
                </button>
            </div>
        </div>
    );

    return (
        <div className="call-logs-page flex flex-col gap-6">
            {/* Toast */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                    {toast.message}
                </div>
            )}

            {/* Modals */}
            {showMakeCallModal && (
                <MakeCallModal
                    onClose={() => setShowMakeCallModal(false)}
                    onCallInitiated={handleCallInitiated}
                />
            )}
            {selectedCall && (
                <CallDetailsModal
                    call={selectedCall}
                    onClose={() => setSelectedCall(null)}
                />
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Call Logs</h1>
                    <p>Track and analyze all call activities with AI insights.</p>
                </div>
                <div className="header-right" style={{ display: 'flex', gap: '0.75rem' }}>
                    {hasPermission('calls', 'edit') && (
                        <>
                            <button
                                className="btn shadow-lg"
                                onClick={toggleDialer}
                                style={{
                                    background: 'var(--bg-card)',
                                    color: 'var(--primary)',
                                    border: '1px solid var(--border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem'
                                }}
                                title="Open Dialer"
                            >
                                <i className="ri-keyboard-box-line" style={{ fontSize: '1.25rem' }}></i>
                            </button>
                            <button className="btn btn-primary shadow-lg shadow-primary/20" onClick={() => setShowMakeCallModal(true)}>
                                <i className="ri-phone-fill mr-2"></i> Make Call
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Stats */}
            {renderStatsCards()}

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
                            placeholder="Search calls..."
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

                    {/* Listened Filter */}
                    <button
                        onClick={() => setShowOnlyListened(!showOnlyListened)}
                        style={{
                            padding: '0.625rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: showOnlyListened ? '#10b981' : 'white',
                            fontSize: '0.875rem',
                            color: showOnlyListened ? 'white' : '#1f2937',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.375rem',
                            fontWeight: '500',
                            flexShrink: 0,
                            transition: 'all 0.2s'
                        }}
                    >
                        <i className={showOnlyListened ? 'ri-headphone-fill' : 'ri-headphone-line'}></i>
                        Listened ({listenedRecordings.length})
                    </button>

                    {/* Export Button */}
                    {hasPermission('calls', 'view') && (
                        <button
                            onClick={handleExport}
                            style={{
                                padding: '0.625rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: 'white',
                                fontSize: '0.875rem',
                                color: '#1f2937',
                                cursor: 'pointer',
                                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                fontWeight: '500',
                                flexShrink: 0
                            }}
                        >
                            <i className="ri-download-line" style={{ color: 'var(--primary)' }}></i> Export
                        </button>
                    )}

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

            {/* Content */}
            {viewMode === 'table' ? renderTableView() : renderCardView()}

            {/* Pagination */}
            {pagination.total > 0 && renderPagination()}
        </div>
    );
};

export default CallLogs;
