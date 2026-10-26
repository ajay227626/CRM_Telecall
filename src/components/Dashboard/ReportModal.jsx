import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import useEscapeKey from '../../hooks/useEscapeKey';
import { getLeads, getCallLogs, getDashboardStats } from '../../utils/api';
import { exportToCSV } from '../../utils/exportUtils';

const ReportModal = ({ onClose }) => {
    useEscapeKey(onClose);
    const [loading, setLoading] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleExportLeads = async () => {
        setLoading('leads');
        setSuccess(null);
        try {
            const data = await getLeads({ limit: 1000 });
            const leads = data.leads || [];
            if (leads.length === 0) {
                alert('No leads to export');
                setLoading(null);
                return;
            }
            const dataToExport = leads.map(lead => ({
                Name: lead.name,
                Email: lead.email,
                Phone: lead.phone,
                WhatsApp: lead.whatsapp || '',
                Category: lead.category,
                Source: lead.source,
                Status: lead.status || 'New',
                AssignedTo: lead.assignedTo,
                FollowUpDate: lead.followUpDate ? new Date(lead.followUpDate).toLocaleDateString() : '',
                Notes: lead.notes || '',
                CreatedAt: new Date(lead.createdAt).toLocaleDateString()
            }));
            exportToCSV(dataToExport, `leads_report_${new Date().toISOString().split('T')[0]}`);
            setSuccess('leads');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            alert('Failed to export leads: ' + err.message);
        } finally {
            setLoading(null);
        }
    };

    const handleExportCallLogs = async () => {
        setLoading('calls');
        setSuccess(null);
        try {
            const data = await getCallLogs({ limit: 1000 });
            const logs = data.callLogs || [];
            if (logs.length === 0) {
                alert('No call logs to export');
                setLoading(null);
                return;
            }
            const dataToExport = logs.map(log => ({
                LeadName: log.leadName,
                Caller: log.caller,
                CallTime: new Date(log.callTime).toLocaleString(),
                Duration: log.duration ? `${Math.floor(log.duration / 60)}:${(log.duration % 60).toString().padStart(2, '0')}` : '0:00',
                Status: log.status,
                CallType: log.callType,
                AIScore: log.aiScore || 'N/A',
                Notes: log.notes || ''
            }));
            exportToCSV(dataToExport, `call_logs_report_${new Date().toISOString().split('T')[0]}`);
            setSuccess('calls');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            alert('Failed to export call logs: ' + err.message);
        } finally {
            setLoading(null);
        }
    };

    const handleExportAnalytics = async () => {
        setLoading('analytics');
        setSuccess(null);
        try {
            const stats = await getDashboardStats();
            const dataToExport = [{
                ReportDate: new Date().toLocaleDateString(),
                TotalLeads: stats.totalLeads || 0,
                ActiveLeads: stats.activeLeads || 0,
                ConvertedLeads: stats.convertedLeads || 0,
                TotalCalls: stats.totalCalls || 0,
                CompletedCalls: stats.completedCalls || 0,
                AvgCallDuration: stats.avgDuration || '0:00',
                AvgAIScore: stats.avgScore || 0,
                ConversionRate: stats.conversionRate || '0%',
                FollowUpsPending: stats.followUpsPending || 0
            }];
            exportToCSV(dataToExport, `analytics_summary_${new Date().toISOString().split('T')[0]}`);
            setSuccess('analytics');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            alert('Failed to export analytics: ' + err.message);
        } finally {
            setLoading(null);
        }
    };

    const handleShareReport = () => {
        setLoading('share');
        // Simulate sharing
        setTimeout(() => {
            const shareUrl = `${window.location.origin}/shared-report/${Date.now()}`;
            navigator.clipboard.writeText(shareUrl).then(() => {
                setSuccess('share');
                setTimeout(() => setSuccess(null), 3000);
            }).catch(() => {
                alert('Report link: ' + shareUrl);
            });
            setLoading(null);
        }, 1000);
    };

    const reportOptions = [
        {
            id: 'leads',
            icon: 'ri-user-line',
            title: 'Export All Leads',
            description: 'Download complete leads database as CSV',
            color: '#10b981',
            bgLight: '#d1fae5',
            onClick: handleExportLeads
        },
        {
            id: 'calls',
            icon: 'ri-phone-line',
            title: 'Export Call Logs',
            description: 'Download all call history with AI scores',
            color: '#3b82f6',
            bgLight: '#dbeafe',
            onClick: handleExportCallLogs
        },
        {
            id: 'analytics',
            icon: 'ri-bar-chart-box-line',
            title: 'Analytics Summary',
            description: 'Export dashboard metrics and KPIs',
            color: '#8b5cf6',
            bgLight: '#ede9fe',
            onClick: handleExportAnalytics
        },
        {
            id: 'share',
            icon: 'ri-share-forward-line',
            title: 'Share Report Link',
            description: 'Generate shareable link for team access',
            color: '#f59e0b',
            bgLight: '#fef3c7',
            onClick: handleShareReport
        }
    ];

    const modalContent = (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div style={{
                width: '550px',
                maxWidth: '95vw',
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                {/* Header with Brand Color */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-file-chart-line" style={{ fontSize: '24px', color: 'white' }}></i>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>Generate Report</h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Select report type to export</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '40px',
                            height: '40px',
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
                        <i className="ri-close-line" style={{ fontSize: '22px' }}></i>
                    </button>
                </div>

                {/* Report Options */}
                <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                        {reportOptions.map(option => (
                            <button
                                key={option.id}
                                onClick={option.onClick}
                                disabled={loading !== null}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1.25rem',
                                    background: success === option.id ? '#d1fae5' : 'var(--bg-card)',
                                    border: `2px solid ${success === option.id ? '#10b981' : '#e5e7eb'}`,
                                    borderRadius: '0.875rem',
                                    cursor: loading ? 'wait' : 'pointer',
                                    transition: 'all 0.2s',
                                    textAlign: 'left',
                                    width: '100%',
                                    opacity: loading && loading !== option.id ? 0.5 : 1
                                }}
                                onMouseEnter={(e) => {
                                    if (!loading) {
                                        e.currentTarget.style.borderColor = option.color;
                                        e.currentTarget.style.background = option.bgLight;
                                        e.currentTarget.style.transform = 'translateX(4px)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!loading && success !== option.id) {
                                        e.currentTarget.style.borderColor = '#e5e7eb';
                                        e.currentTarget.style.background = 'var(--bg-card)';
                                        e.currentTarget.style.transform = 'translateX(0)';
                                    }
                                }}
                            >
                                <div style={{
                                    width: '52px',
                                    height: '52px',
                                    borderRadius: '12px',
                                    background: success === option.id ? '#10b981' : option.color,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: `0 4px 12px ${option.color}40`,
                                    flexShrink: 0
                                }}>
                                    {loading === option.id ? (
                                        <i className="ri-loader-4-line" style={{ fontSize: '24px', color: 'white', animation: 'spin 1s linear infinite' }}></i>
                                    ) : success === option.id ? (
                                        <i className="ri-check-line" style={{ fontSize: '24px', color: 'white' }}></i>
                                    ) : (
                                        <i className={option.icon} style={{ fontSize: '24px', color: 'white' }}></i>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h4 style={{
                                        margin: 0,
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        color: success === option.id ? '#047857' : 'var(--text-main)',
                                        marginBottom: '0.25rem'
                                    }}>
                                        {success === option.id ? `${option.title} ✓` : option.title}
                                    </h4>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '0.8125rem',
                                        color: success === option.id ? '#059669' : '#6b7280'
                                    }}>
                                        {loading === option.id ? 'Processing...' :
                                            success === option.id ? 'Download started!' :
                                                option.description}
                                    </p>
                                </div>
                                <i className="ri-arrow-right-s-line" style={{
                                    fontSize: '24px',
                                    color: success === option.id ? '#10b981' : '#d1d5db',
                                    transition: 'transform 0.2s'
                                }}></i>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-main)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <span style={{ fontSize: '0.8125rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <i className="ri-information-line"></i>
                        Reports are exported as CSV files
                    </span>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.625rem 1.25rem',
                            background: 'var(--primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '0.875rem'
                        }}
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default ReportModal;
