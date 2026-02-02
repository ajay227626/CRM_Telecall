import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, LineChart, Line,
    PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { getDashboardStats, getDashboardDetails, markNotificationRead, getChartData } from '../utils/api';
import { formatChartDate, formatTimeAgo } from '../utils/dateUtils';
import StatCard from '../components/Dashboard/StatCard';
import NotificationDropdown from '../components/Dashboard/NotificationDropdown';
import QuickActionsModal from '../components/Dashboard/QuickActionsModal';
import AddLeadModal from '../components/Leads/AddLeadModal';
import MakeCallModal from '../components/CallLogs/MakeCallModal';
import ReportModal from '../components/Dashboard/ReportModal';
import TaskModal from '../components/Dashboard/TaskModal';
import CustomDateModal from '../components/Dashboard/CustomDateModal';
import ActivityDetailsModal from '../components/Activity/ActivityDetailsModal';
import usePermissions from '../hooks/usePermissions';

const Dashboard = () => {
    const navigate = useNavigate();
    const { hasPermission, hasAnyPermission } = usePermissions();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeCard, setActiveCard] = useState('total-leads');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

    // Modal States
    const [showAddLead, setShowAddLead] = useState(false);
    const [showMakeCall, setShowMakeCall] = useState(false);
    const [showReportOptions, setShowReportOptions] = useState(false);
    const [showTaskModal, setShowTaskModal] = useState(false);

    // Time View State
    const [timeView, setTimeView] = useState('weekly');
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);
    const [customDateRange, setCustomDateRange] = useState(null);

    const [detailsData, setDetailsData] = useState([]);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState(null);

    const notificationRef = useRef(null);

    // Function to handle actions from QuickActionsModal
    const handleQuickAction = (action) => {
        setShowQuickActions(false); // Close the menu
        switch (action) {
            case 'add-lead':
                setShowAddLead(true);
                break;
            case 'make-call':
                setShowMakeCall(true);
                break;
            case 'generate-report':
                setShowReportOptions(true);
                break;
            case 'view-tasks':
                setShowTaskModal(true);
                break;
            default:
                break;
        }
    };

    // Close notifications on ESC
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                if (showNotifications) setShowNotifications(false);
                if (showReportOptions) setShowReportOptions(false);
            }
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [showNotifications, showReportOptions]);

    useEffect(() => {
        loadDashboardData();

        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleDismissNotification = async (id) => {
        try {
            await markNotificationRead(id);
            setStats(prev => ({
                ...prev,
                notifications: prev.notifications.filter(n => n.id !== id && n._id !== id)
            }));
        } catch (error) {
            console.error('Failed to dismiss notification', error);
        }
    };

    useEffect(() => {
        if (activeCard) {
            loadDetails(activeCard);
        }
    }, [activeCard]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const data = await getDashboardStats();
            setStats(data);
        } catch (err) {
            console.error('Failed to load dashboard stats', err);
        } finally {
            setLoading(false);
        }
    };

    const loadDetails = async (cardId) => {
        setDetailsLoading(true);
        try {
            let category = 'leads';
            if (cardId === 'conversion') category = 'conversion';
            if (cardId === 'calls') category = 'calls';

            const data = await getDashboardDetails(category);
            setDetailsData(data);
        } catch (err) {
            console.error('Failed to load details', err);
        } finally {
            setDetailsLoading(false);
        }
    };

    const [chartData, setChartData] = useState([]);
    const [chartLoading, setChartLoading] = useState(false);

    useEffect(() => {
        const fetchChartData = async () => {
            if (!activeCard) return;

            let type = 'leads';
            if (activeCard === 'calls') type = 'calls';
            // Conversion/Status uses different data source (detailsData), skipping chart fetch for it if not needed, 
            // but user might want trend over time for conversion? 
            // For now, let's stick to Leads and Calls trends which are the main graphs.
            if (activeCard === 'conversion' || activeCard === 'followups') return;

            setChartLoading(true);
            try {
                const data = await getChartData(timeView, type, customDateRange);
                setChartData(data);
            } catch (error) {
                console.error("Failed to fetch chart data", error);
                setChartData([]);
            } finally {
                setChartLoading(false);
            }
        };

        fetchChartData();
    }, [timeView, activeCard, customDateRange]);

    if (loading) {
        return (
            <div className="loading-container">
                <i className="ri-loader-4-line spin" style={{ fontSize: '48px' }}></i>
                <p>Preparing your dashboard...</p>
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="loading-container">
                <i className="ri-error-warning-line" style={{ fontSize: '48px', color: '#dc2626' }}></i>
                <p>Failed to load dashboard data. Please try refreshing the page.</p>
                <button
                    onClick={loadDashboardData}
                    style={{
                        marginTop: '1rem',
                        padding: '0.75rem 1.5rem',
                        borderRadius: '0.5rem',
                        border: 'none',
                        background: 'var(--primary)',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '1rem',
                        fontWeight: '600'
                    }}
                >
                    Retry
                </button>
            </div>
        );
    }

    const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED'];

    const renderCharts = () => {
        if (detailsLoading) {
            return (
                <div className="details-loading">
                    <i className="ri-loader-4-line spin" style={{ fontSize: '32px' }}></i>
                    <span>Loading analytics...</span>
                </div>
            );
        }

        switch (activeCard) {
            case 'total-leads':
            case 'new-leads':
                return (
                    <div className="chart-container">
                        <div className="chart-header">
                            <h4>Lead Growth Over Time</h4>
                            <div className="chart-actions">
                                <button className={`chart-btn ${timeView === 'daily' ? 'active' : ''}`} onClick={() => setTimeView('daily')}>Daily</button>
                                <button className={`chart-btn ${timeView === 'weekly' ? 'active' : ''}`} onClick={() => setTimeView('weekly')}>Weekly</button>
                                <button className={`chart-btn ${timeView === 'monthly' ? 'active' : ''}`} onClick={() => setTimeView('monthly')}>Monthly</button>
                                <button className={`chart-btn ${timeView === 'yearly' ? 'active' : ''}`} onClick={() => setTimeView('yearly')}>Yearly</button>
                                <button className={`chart-btn ${timeView === 'custom' ? 'active' : ''}`} onClick={() => setShowCustomDateModal(true)}>
                                    {customDateRange ? customDateRange.label : 'Custom'}
                                </button>
                            </div>
                        </div>
                        {chartLoading ? (
                            <div className="flex justify-center items-center h-[300px]">
                                <i className="ri-loader-4-line spin text-2xl text-blue-500"></i>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData.length > 0 ? chartData.map(d => ({ name: d._id, value: d.count })) : []}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#2563EB" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="name"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                        tickFormatter={(tick) => formatChartDate(tick, timeView)}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#6B7280' }}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        labelFormatter={(label) => formatChartDate(label, timeView)}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                );
            case 'conversion':
                return (
                    <div className="chart-container grid-2">
                        <div className="chart-box">
                            <h4>Lead Conversion Funnel</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <BarChart data={stats.statusDistribution.map(s => ({ name: s._id, count: s.count }))}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#2563EB" radius={[4, 4, 0, 0]} barSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="chart-box">
                            <h4>Status Distribution</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <PieChart>
                                    <Pie
                                        data={stats.statusDistribution.map(s => ({ name: s._id, value: s.count }))}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {stats.statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );
            case 'calls':
                return (
                    <div className="chart-container">
                        <div className="chart-header">
                            <h4>Call Activity Log</h4>
                            <div className="chart-actions">
                                <button className={`chart-btn ${timeView === 'daily' ? 'active' : ''}`} onClick={() => setTimeView('daily')}>Daily</button>
                                <button className={`chart-btn ${timeView === 'weekly' ? 'active' : ''}`} onClick={() => setTimeView('weekly')}>Weekly</button>
                                <button className={`chart-btn ${timeView === 'monthly' ? 'active' : ''}`} onClick={() => setTimeView('monthly')}>Monthly</button>
                            </div>
                        </div>
                        {chartLoading ? (
                            <div className="flex justify-center items-center h-[300px]">
                                <i className="ri-loader-4-line spin text-2xl text-emerald-500"></i>
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={chartData.length > 0 ? chartData.map(t => ({ name: t._id, calls: t.count })) : []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="name"
                                        tickFormatter={(tick) => formatChartDate(tick, timeView)}
                                    />
                                    <YAxis />
                                    <Tooltip
                                        labelFormatter={(label) => formatChartDate(label, timeView)}
                                    />
                                    <Line type="monotone" dataKey="calls" stroke="#059669" strokeWidth={3} dot={{ fill: '#059669', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                );
            default:
                return <div className="placeholder-chart">Analytics for this category coming soon</div>;
        }
    };

    return (
        <div className="dashboard-page">
            {/* Quick Actions Modal */}
            {showQuickActions && (
                <QuickActionsModal
                    onClose={() => setShowQuickActions(false)}
                    onAction={handleQuickAction}
                />
            )}

            {/* Feature Modals */}
            {showAddLead && hasPermission('leads', 'create') && (
                <AddLeadModal
                    lead={null} // explicit null if adding new
                    onClose={() => setShowAddLead(false)}
                    onSave={() => {
                        setShowAddLead(false);
                        loadDashboardData(); // Refresh stats
                    }}
                />
            )}

            {showMakeCall && hasPermission('calls', 'create') && (
                <MakeCallModal
                    isOpen={showMakeCall}
                    onClose={() => setShowMakeCall(false)}
                    onCallStart={(lead) => {
                        console.log('Call started with:', lead);
                        setShowMakeCall(false);
                    }}
                />
            )}

            {/* Report Modal */}
            {showReportOptions && (
                <ReportModal onClose={() => setShowReportOptions(false)} />
            )}

            {/* Task Modal */}
            {showTaskModal && (
                <TaskModal onClose={() => setShowTaskModal(false)} />
            )}

            {/* Custom Date Range Modal */}
            {showCustomDateModal && (
                <CustomDateModal
                    onClose={() => setShowCustomDateModal(false)}
                    onApply={(dateRange) => {
                        setCustomDateRange(dateRange);
                        setTimeView('custom');
                        // Here you can also filter chart data based on dateRange.from and dateRange.to
                        console.log('Applied date range:', dateRange);
                    }}
                />
            )}

            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left">
                    <h1>Welcome back, {JSON.parse(localStorage.getItem('user'))?.name || 'User'}!</h1>
                    <p>Here's what's happening with your leads today.</p>
                </div>
                <div className="header-right">
                    <div className="notification-wrapper" ref={notificationRef}>
                        <button
                            className={`header-btn notification-btn ${stats.notifications.length > 0 ? 'has-unread' : ''}`}
                            onClick={() => setShowNotifications(!showNotifications)}
                        >
                            <i className="ri-notification-3-line" style={{ fontSize: '20px' }}></i>
                            {stats.notifications.length > 0 && (
                                <span className="notification-badge">{stats.notifications.length}</span>
                            )}
                            <span className="btn-text">Notifications</span>
                        </button>
                        {showNotifications && (
                            <NotificationDropdown
                                notifications={stats.notifications}
                                onClose={() => setShowNotifications(false)}
                                onDismiss={handleDismissNotification}
                                onMarkAllRead={async () => {
                                    try {
                                        // Mark all notifications as read
                                        await Promise.all(stats.notifications.map(n => markNotificationRead(n.id || n._id)));
                                        setStats(prev => ({
                                            ...prev,
                                            notifications: []
                                        }));
                                    } catch (error) {
                                        console.error('Failed to mark all as read', error);
                                    }
                                }}
                            />
                        )}
                    </div>
                    {hasAnyPermission('leads') && (
                        <button
                            className="header-btn"
                            onClick={() => navigate('/pipeline')}
                            style={{
                                background: 'var(--primary)',
                                color: 'white',
                                padding: '0.5rem 1rem'
                            }}
                            title="Pipeline View"
                        >
                            <i className="ri-kanban-view" style={{ fontSize: '20px' }}></i>
                        </button>
                    )}
                    {hasAnyPermission('leads') || hasAnyPermission('calls') ? (
                        <button className="header-btn quick-action-btn" onClick={() => setShowQuickActions(true)}>
                            <i className="ri-add-line" style={{ fontSize: '20px' }}></i>
                            <span className="btn-text">Quick Actions</span>
                        </button>
                    ) : null}
                </div>
            </div>

            {/* Security Nudges */}
            {(() => {
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                // Nudge 1: User has no password (social only) -> High Priority
                if (!user.hasPassword) {
                    return (
                        <div className="alert-banner warning mb-6" style={{
                            background: 'rgba(251, 146, 60, 0.15)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.5rem',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}>
                            <i className="ri-shield-keyhole-line text-orange-600" style={{ fontSize: '24px' }}></i>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, color: '#9a3412', fontSize: '1rem' }}>Set a Password for Your Account</h4>
                                <p style={{ margin: 0, color: '#c2410c', fontSize: '0.875rem' }}>
                                    You are currently using social login. Set a password to ensure you never lose access.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="btn btn-warning"
                                style={{ whiteSpace: 'nowrap' }}
                            >
                                Set Password
                            </button>
                        </div>
                    );
                }
                // Nudge 2: User has password but no linked accounts -> Low Priority (Optional)
                if (user.hasPassword && !user.googleId && !user.microsoftId && !user.facebookId) {
                    return (
                        <div className="alert-banner info mb-6" style={{
                            background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border)', padding: '1rem', borderRadius: '0.5rem',
                            display: 'flex', alignItems: 'center', gap: '1rem'
                        }}>
                            <i className="ri-links-line text-blue-600" style={{ fontSize: '24px' }}></i>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, color: '#1e40af', fontSize: '1rem' }}>Link Social Accounts</h4>
                                <p style={{ margin: 0, color: '#1d4ed8', fontSize: '0.875rem' }}>
                                    Link Google or Facebook for faster, one-click login.
                                </p>
                            </div>
                            <button
                                onClick={() => navigate('/profile')}
                                className="btn btn-primary-outline"
                                style={{ background: 'white', borderColor: '#3b82f6', color: '#2563EB', whiteSpace: 'nowrap' }}
                            >
                                Link Account
                            </button>
                        </div>
                    );
                }
                return null;
            })()}

            {/* Stats Cards */}
            <div className="dashboard-stats-grid">
                <StatCard
                    title="Total Leads"
                    value={stats.summary.totalLeads.toLocaleString()}
                    subtext="Growth since last month"
                    trend={stats.summary.totalLeadsTrend}
                    icon={<i className="ri-group-line" style={{ fontSize: '20px' }}></i>}
                    color="#2563EB"
                    active={activeCard === 'total-leads'}
                    onClick={() => setActiveCard('total-leads')}
                />
                <StatCard
                    title="New Leads"
                    value={stats.summary.newLeadsToday.toLocaleString()}
                    subtext="vs yesterday"
                    trend={stats.summary.newLeadsTrend}
                    icon={<i className="ri-user-add-line" style={{ fontSize: '20px' }}></i>}
                    color="#059669"
                    active={activeCard === 'new-leads'}
                    onClick={() => setActiveCard('new-leads')}
                />
                <StatCard
                    title="Contacted Today"
                    value={stats.summary.contactedToday.toLocaleString()}
                    subtext="vs yesterday"
                    trend={stats.summary.contactedTrend}
                    icon={<i className="ri-phone-line" style={{ fontSize: '20px' }}></i>}
                    color="#7C3AED"
                    active={activeCard === 'contacted'}
                    onClick={() => setActiveCard('contacted')}
                />
                <StatCard
                    title="Follow-ups Due"
                    value={stats.summary.followupsDue.toLocaleString()}
                    subtext="Requires attention"
                    trend={0} // No historical trend for "Due Now"
                    icon={<i className="ri-calendar-line" style={{ fontSize: '20px' }}></i>}
                    color="#D97706"
                    active={activeCard === 'followups'}
                    onClick={() => setActiveCard('followups')}
                />
                <StatCard
                    title="Conversion Rate"
                    value={`${stats.summary.conversionRate}%`}
                    subtext="vs last week"
                    trend={stats.summary.conversionRateTrend}
                    icon={<i className="ri-line-chart-line" style={{ fontSize: '20px' }}></i>}
                    color="#059669"
                    active={activeCard === 'conversion'}
                    onClick={() => setActiveCard('conversion')}
                />
                <StatCard
                    title="Calls Today"
                    value={stats.summary.callsToday.toLocaleString()}
                    subtext="vs yesterday"
                    trend={stats.summary.callsTrend}
                    icon={<i className="ri-phone-line" style={{ fontSize: '20px' }}></i>}
                    color="#DC2626"
                    active={activeCard === 'calls'}
                    onClick={() => setActiveCard('calls')}
                />
            </div>

            {/* Analytics Section - Dynamic Content */}
            {hasPermission('dashboard', 'viewAnalytics') && (
                <div className="analytics-section">
                    <div className="analytics-header">
                        <div className="analytics-title">
                            <h3>{activeCard.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')} Analytics</h3>
                            <p>Detailed performance metrics and trends</p>
                        </div>
                        <div className="analytics-actions">
                            <button className="btn btn-secondary" onClick={loadDashboardData}>
                                <i className="ri-refresh-line" style={{ fontSize: '16px', marginRight: '4px' }}></i> Refresh
                            </button>
                            <button className="btn btn-secondary">
                                <i className="ri-download-line" style={{ fontSize: '16px', marginRight: '4px' }}></i> Export
                            </button>
                        </div>
                    </div>
                    <div className="analytics-content">
                        {renderCharts()}
                    </div>
                </div>
            )}

            {/* Bottom Row - Activity & Tasks */}
            <div className="dashboard-bottom-grid">
                {/* Recent Activity Card */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
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
                                <i className="ri-pulse-line" style={{ fontSize: '20px', color: 'white' }}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>Recent Activity</h3>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>Last 24 hours</p>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/activity')}
                            style={{
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                cursor: 'pointer',
                                fontSize: '0.8125rem',
                                fontWeight: '600',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                backdropFilter: 'blur(10px)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
                        >
                            View All <i className="ri-arrow-right-line"></i>
                        </button>
                    </div>


                    {selectedActivity && (
                        <ActivityDetailsModal
                            activity={selectedActivity}
                            onClose={() => setSelectedActivity(null)}
                        />
                    )}
                    <div style={{ padding: '0.75rem 0' }}>
                        {(stats.recentActivity && stats.recentActivity.length > 0) ? (
                            stats.recentActivity.map((activity, index) => (
                                <div
                                    key={index}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem',
                                        padding: '1rem 1.5rem',
                                        borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none',
                                        transition: 'background 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedActivity(activity)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '44px',
                                        height: '44px',
                                        borderRadius: '12px',
                                        background: activity.bg,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                                        flexShrink: 0
                                    }}>
                                        <i className={activity.icon} style={{ fontSize: '18px', color: 'white' }}></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                                            <strong style={{ color: '#374151' }}>{activity.user}</strong> {activity.action} <strong style={{ color: '#6366f1' }}>{activity.target}</strong>
                                        </p>
                                        <span style={{ fontSize: '0.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                            <i className="ri-time-line"></i> {formatTimeAgo(activity.time)}
                                        </span>
                                    </div>
                                    <i className="ri-arrow-right-s-line" style={{ color: '#d1d5db', fontSize: '20px' }}></i>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
                                No recent activity
                            </div>
                        )}
                    </div>
                </div>

                {/* Tasks Card */}
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '1rem',
                    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.08)',
                    overflow: 'hidden'
                }}>
                    {/* Header */}
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
                                <i className="ri-task-line" style={{ fontSize: '20px', color: 'white' }}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>Your Tasks Today</h3>
                                <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>1 of 3 completed</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowTaskModal(true)}
                            style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '10px',
                                border: 'none',
                                background: 'rgba(255, 255, 255, 0.25)',
                                color: 'white',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.4)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                        >
                            <i className="ri-add-line" style={{ fontSize: '20px' }}></i>
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ padding: '1rem 1.5rem 0.5rem', background: 'rgba(251, 191, 36, 0.15)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: 'var(--text-secondary)' }}>Progress</span>
                            <span style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-secondary)' }}>33%</span>
                        </div>
                        <div style={{
                            height: '8px',
                            background: 'rgba(255,255,255,0.6)',
                            borderRadius: '4px',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                width: '33%',
                                height: '100%',
                                background: 'linear-gradient(90deg, #f59e0b, #ef4444)',
                                borderRadius: '4px',
                                transition: 'width 0.5s ease'
                            }}></div>
                        </div>
                    </div>

                    {/* Task List */}
                    <div style={{ padding: '0.5rem 0' }}>
                        {[
                            { label: 'Call back potential VIP clients', completed: false, priority: 'high' },
                            { label: 'Update lead status for November campaign', completed: true, priority: 'medium' },
                            { label: 'Prepare weekly performance report', completed: false, priority: 'high' }
                        ].map((task, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '1rem',
                                    padding: '1rem 1.5rem',
                                    borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none',
                                    transition: 'background 0.2s',
                                    cursor: 'pointer',
                                    opacity: task.completed ? 0.6 : 1
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                <div style={{
                                    width: '24px',
                                    height: '24px',
                                    borderRadius: '6px',
                                    border: task.completed ? 'none' : '2px solid #d1d5db',
                                    background: task.completed ? 'linear-gradient(135deg, #10b981, #059669)' : 'var(--bg-card)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flexShrink: 0,
                                    cursor: 'pointer'
                                }}>
                                    {task.completed && <i className="ri-check-line" style={{ color: 'white', fontSize: '14px' }}></i>}
                                </div>
                                <span style={{
                                    flex: 1,
                                    fontSize: '0.9375rem',
                                    color: task.completed ? 'var(--text-secondary)' : 'var(--text-main)',
                                    textDecoration: task.completed ? 'line-through' : 'none'
                                }}>
                                    {task.label}
                                </span>
                                <span style={{
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '4px',
                                    fontSize: '0.625rem',
                                    fontWeight: '700',
                                    textTransform: 'uppercase',
                                    background: task.priority === 'high' ? '#fee2e2' : '#fef3c7',
                                    color: task.priority === 'high' ? '#dc2626' : '#d97706'
                                }}>
                                    {task.priority}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div >
    );
};

export default Dashboard;
