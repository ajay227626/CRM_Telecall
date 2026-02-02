import React from 'react';
import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '../../utils/dateUtils';

const NotificationDropdown = ({ notifications, onClose, onDismiss, onMarkAllRead }) => {
    const navigate = useNavigate();

    const handleViewAll = () => {
        onClose();
        navigate('/notifications');
    };

    const handleDismiss = (e, id) => {
        e.stopPropagation();
        if (onDismiss) {
            onDismiss(id);
        }
    };

    const handleMarkAllRead = () => {
        if (onMarkAllRead) {
            onMarkAllRead();
        }
    };

    return (
        <div className="notification-dropdown">
            <div className="dropdown-header">
                <h3>Notifications</h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {notifications.length > 0 && (
                        <button
                            className="mark-all-read-btn"
                            onClick={handleMarkAllRead}
                            title="Mark all as read"
                            style={{
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                padding: '0.25rem 0.5rem',
                                borderRadius: '0.375rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                fontSize: '0.8125rem',
                                color: 'var(--primary)',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--primary-light)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                            <i className="ri-check-double-line" style={{ fontSize: '16px' }}></i>
                            Mark All Read
                        </button>
                    )}
                    <button className="close-btn" onClick={onClose}><i className="ri-close-line" style={{ fontSize: '16px' }}></i></button>
                </div>
            </div>
            <div className="dropdown-body">
                {notifications.length === 0 ? (
                    <div className="empty-state">No new notifications</div>
                ) : (
                    notifications.map((notif) => (
                        <div key={notif.id || notif._id} className={`notification-item ${notif.severity}`}>
                            <div className="notif-icon">
                                {notif.type === 'followup' && <i className="ri-error-warning-line" style={{ fontSize: '18px' }}></i>}
                                {notif.type === 'lead' && <i className="ri-checkbox-circle-line" style={{ fontSize: '18px' }}></i>}
                                {notif.type === 'call' && <i className="ri-information-line" style={{ fontSize: '18px' }}></i>}
                                {/* Fallback icon */}
                                {!['followup', 'lead', 'call'].includes(notif.type) && <i className="ri-notification-3-line" style={{ fontSize: '18px' }}></i>}
                            </div>
                            <div className="notif-content">
                                <div className="notif-title">{notif.title}</div>
                                <div className="notif-message">{notif.message}</div>
                                <div className="notif-time">
                                    <i className="ri-time-line" style={{ fontSize: '12px' }}></i> {formatTimeAgo(notif.createdAt || notif.time)}
                                </div>
                            </div>
                            <button className="item-close" onClick={(e) => handleDismiss(e, notif.id || notif._id)}>
                                <i className="ri-close-line" style={{ fontSize: '12px' }}></i>
                            </button>
                        </div>
                    ))
                )}
            </div>
            <div className="dropdown-footer">
                <button className="view-all" onClick={handleViewAll}>View All Notifications</button>
            </div>
        </div>
    );
};

export default NotificationDropdown;
