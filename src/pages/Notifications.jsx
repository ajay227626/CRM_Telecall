import React, { useState, useEffect } from 'react';
import { useAppearance } from '../context/AppearanceContext';
import { getNotifications, markNotificationRead, markAllNotificationsRead } from '../utils/api';
import { formatTimeAgo } from '../utils/dateUtils';

const Notifications = () => {
    const { appearance } = useAppearance();
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('all');
    const [notifications, setNotifications] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        setLoading(true);
        try {
            const data = await getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
            // Optionally set an error state here
        } finally {
            setLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await markNotificationRead(id);
            setNotifications(notifications.map(n =>
                n._id === id ? { ...n, read: true } : n
            ));
        } catch (error) {
            console.error('Failed to mark notification as read:', error);
        }
    };

    const handleMarkAllRead = async () => {
        try {
            await markAllNotificationsRead();
            setNotifications(notifications.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all notifications as read:', error);
        }
    };

    const getSeverityColor = (type) => {
        switch (type) {
            case 'success': return '#10b981';
            case 'warning': return '#f59e0b';
            case 'error': return '#ef4444';
            default: return '#3b82f6';
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'success': return <i className="ri-checkbox-circle-line" style={{ fontSize: '1.25rem' }}></i>;
            case 'warning': return <i className="ri-error-warning-line" style={{ fontSize: '1.25rem' }}></i>;
            case 'error': return <i className="ri-close-circle-line" style={{ fontSize: '1.25rem' }}></i>;
            default: return <i className="ri-information-line" style={{ fontSize: '1.25rem' }}></i>;
        }
    };

    const filteredNotifications = notifications.filter(n => {
        // Tab filter
        if (activeTab === 'unread' && n.read) return false;
        if (activeTab === 'system') {
            // System notification heuristic
            return n.title.includes('System') || n.type === 'info';
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            if (!n.title.toLowerCase().includes(query) && !n.message.toLowerCase().includes(query)) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && n.type !== selectedCategory) return false;

        return true;
    });

    return (
        <div className="settings-container">
            <div className="settings-header">
                <h1>Notification Center</h1>
                <p>Manage your alerts and system updates.</p>
            </div>

            <div className="tabs">
                <div
                    className={`tab-item ${activeTab === 'all' ? 'active' : ''}`}
                    onClick={() => setActiveTab('all')}
                >
                    <i className="ri-notification-3-line"></i> All Notifications
                </div>
                <div
                    className={`tab-item ${activeTab === 'unread' ? 'active' : ''}`}
                    onClick={() => setActiveTab('unread')}
                >
                    <i className="ri-mail-unread-line"></i> Unread
                    {notifications.filter(n => !n.read).length > 0 && (
                        <span className="badge" style={{ marginLeft: 'auto', background: 'var(--danger)', color: 'white', padding: '2px 8px', borderRadius: '12px', fontSize: '0.75rem' }}>
                            {notifications.filter(n => !n.read).length}
                        </span>
                    )}
                </div>
            </div>

            <div className="settings-main" style={{ background: 'transparent', padding: 0, boxShadow: 'none' }}>
                {/* Custom Toolbar for Notifications */}
                <div className="filter-bar" style={{ marginBottom: '1rem', background: 'var(--bg-card)', padding: '1rem', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: 'var(--shadow-sm)', flexWrap: 'wrap', gap: '1rem' }}>

                    {/* Search and Filter Group */}
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <div className="search-box" style={{ position: 'relative', width: '250px' }}>
                            <i className="ri-search-line" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}></i>
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{ width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none' }}
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            style={{ width: '150px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
                        >
                            <option value="all">All Categories</option>
                            <option value="info">Info</option>
                            <option value="success">Success</option>
                            <option value="warning">Warning</option>
                            <option value="error">Error</option>
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            <i className="ri-filter-3-line"></i> <strong>{filteredNotifications.length}</strong>
                        </div>
                        <button className="btn btn-secondary" onClick={handleMarkAllRead}>
                            <i className="ri-check-double-line"></i> Mark all read
                        </button>
                    </div>
                </div>

                <div className="notifications-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {loading ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <i className="ri-loader-4-line spin" style={{ fontSize: '2rem' }}></i>
                            <p>Loading notifications...</p>
                        </div>
                    ) : filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                            <div
                                key={notification._id}
                                className={`notification-card ${!notification.read ? 'unread' : ''}`}
                                style={{
                                    background: 'var(--bg-card)',
                                    padding: '1.5rem',
                                    borderRadius: '12px',
                                    boxShadow: 'var(--shadow-sm)',
                                    display: 'flex',
                                    gap: '1rem',
                                    borderLeft: `4px solid ${getSeverityColor(notification.type)}`,
                                    transition: 'transform 0.2s',
                                    position: 'relative'
                                }}
                            >
                                <div className="icon-box" style={{
                                    background: `${getSeverityColor(notification.type)}20`,
                                    color: getSeverityColor(notification.type),
                                    padding: '0.75rem',
                                    borderRadius: '8px',
                                    height: 'fit-content'
                                }}>
                                    {getIcon(notification.type)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: notification.read ? 'var(--text-secondary)' : 'var(--text-main)' }}>
                                            {notification.title}
                                        </h4>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <i className="ri-time-line"></i> {formatTimeAgo(notification.createdAt)}
                                        </span>
                                    </div>
                                    <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {notification.message}
                                    </p>
                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
                                        {!notification.read && (
                                            <button
                                                onClick={() => handleMarkRead(notification._id)}
                                                style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500 }}
                                            >
                                                Mark as Read
                                            </button>
                                        )}
                                        {/* You can add Dismiss functionality if needed */}
                                    </div>
                                </div>
                                {!notification.read && <div style={{ width: '8px', height: '8px', background: 'var(--primary)', borderRadius: '50%', position: 'absolute', top: '1.5rem', right: '1.5rem' }}></div>}
                            </div>
                        ))
                    ) : (
                        <div style={{ textAlign: 'center', padding: '3rem', background: 'var(--bg-card)', borderRadius: '12px', color: 'var(--text-secondary)' }}>
                            <i className="ri-search-line" style={{ fontSize: '2rem', marginBottom: '1rem', display: 'block' }}></i>
                            No notifications match your search
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
