import React, { useState, useEffect } from 'react';
import { formatTimeAgo } from '../utils/dateUtils';
import ActivityDetailsModal from '../components/Activity/ActivityDetailsModal';

const Activity = () => {
    const [filter, setFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    const [selectedActivity, setSelectedActivity] = useState(null);

    useEffect(() => {
        fetchActivities();
    }, [filter, dateFilter]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const queryParams = new URLSearchParams({
                filter,
                dateFilter,
                limit: 50 // Fetch enough for a good view
            });

            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities?${queryParams}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await res.json();
            setActivities(data.activities || []);
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const getColorClasses = (color) => {
        const colors = {
            blue: { bg: '#DBEAFE', text: '#2563EB' },
            green: { bg: '#D1FAE5', text: '#059669' },
            yellow: { bg: '#FEF3C7', text: '#D97706' },
            red: { bg: '#FEE2E2', text: '#DC2626' },
            purple: { bg: '#EDE9FE', text: '#7C3AED' },
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="activity-page">
            {selectedActivity && (
                <ActivityDetailsModal
                    activity={selectedActivity}
                    onClose={() => setSelectedActivity(null)}
                />
            )}
            <div className="page-header" style={{ marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: '700', margin: '0 0 0.25rem 0' }}>Activity Log</h1>
                    <p style={{ color: '#6B7280', margin: 0 }}>Track all actions and events across your CRM</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <select
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        style={{
                            padding: '0.625rem 1rem',
                            border: '1px solid var(--border)',
                            borderRadius: '0.5rem',
                            background: 'var(--bg-card)',
                            fontSize: '0.875rem',
                            color: 'var(--text-main)'
                        }}
                    >
                        <option value="today">Today</option>
                        <option value="week">This Week</option>
                        <option value="month">This Month</option>
                        <option value="all">All Time</option>
                    </select>
                    <button style={{
                        padding: '0.625rem 1rem',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        background: 'var(--bg-card)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        fontSize: '0.875rem',
                        color: 'var(--text-main)'
                    }}>
                        <i className="ri-download-line"></i> Export
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.5rem',
                marginBottom: '1.5rem',
                background: 'var(--bg-main)',
                padding: '0.375rem',
                borderRadius: '0.75rem',
                width: 'fit-content'
            }}>
                {[
                    { id: 'all', label: 'All Activity', icon: 'ri-list-check' },
                    { id: 'call', label: 'Calls', icon: 'ri-phone-line' },
                    { id: 'lead', label: 'Leads', icon: 'ri-user-line' },
                    { id: 'system', label: 'System', icon: 'ri-settings-3-line' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        style={{
                            padding: '0.625rem 1.25rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            background: filter === tab.id ? 'var(--bg-card)' : 'transparent',
                            color: filter === tab.id ? '#2563EB' : '#6B7280',
                            cursor: 'pointer',
                            fontWeight: filter === tab.id ? '600' : '500',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            fontSize: '0.875rem',
                            boxShadow: filter === tab.id ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            transition: 'all 0.2s'
                        }}
                    >
                        <i className={tab.icon}></i>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Activity List */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-main)' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
                        {activities.length} activities
                    </span>
                </div>
                <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>Loading...</div>
                    ) : activities.length > 0 ? (
                        activities.map((activity, index) => {
                            const colorClasses = getColorClasses(activity.color);
                            return (
                                <div
                                    key={activity.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '1rem',
                                        padding: '1.25rem 1.5rem',
                                        borderBottom: index < activities.length - 1 ? '1px solid #F3F4F6' : 'none',
                                        transition: 'background 0.2s',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => setSelectedActivity(activity)}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '10px',
                                        background: colorClasses.bg,
                                        color: colorClasses.text,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                    }}>
                                        <i className={activity.icon} style={{ fontSize: '18px' }}></i>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9375rem' }}>
                                            <strong>{activity.user}</strong> {activity.action} <strong>{activity.target}</strong>
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontSize: '0.8125rem', color: '#9CA3AF' }}>
                                                <i className="ri-time-line" style={{ marginRight: '4px' }}></i>
                                                {formatTimeAgo(activity.time)}
                                            </span>
                                            <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>
                                                {activity.details}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setSelectedActivity(activity);
                                        }}
                                        style={{
                                            padding: '0.5rem 1rem',
                                            border: '1px solid var(--border)',
                                            borderRadius: '0.5rem',
                                            background: 'var(--bg-card)',
                                            cursor: 'pointer',
                                            fontSize: '0.8125rem',
                                            color: 'var(--text-secondary)'
                                        }}>
                                        View Details
                                    </button>
                                </div>
                            );
                        })
                    ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#6B7280' }}>
                            No activity found based on current filters.
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
};

export default Activity;
