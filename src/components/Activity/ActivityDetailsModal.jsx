import React from 'react';

const ActivityDetailsModal = ({ activity, onClose }) => {
    if (!activity) return null;

    const getColorClasses = (color) => {
        const colors = {
            blue: { bg: '#DBEAFE', text: '#2563EB' },
            green: { bg: '#D1FAE5', text: '#059669' },
            yellow: { bg: '#FEF3C7', text: '#D97706' },
            red: { bg: '#FEE2E2', text: '#DC2626' },
            purple: { bg: '#EDE9FE', text: '#7C3AED' },
        };
        // Fallback to blue if color is undefined or invalid
        return colors[color] || (activity.bg ? { bg: activity.bg, text: '#fff' } : colors.blue);
    };

    const colorClasses = getColorClasses(activity.color);

    // Check if background is a gradient (from dashboard) or a color (from activity list)
    // If it's a gradient, we might want to handle it differently, or just use it as bg
    const iconStyle = {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
        ... (activity.bg && activity.bg.includes('gradient') ? { background: activity.bg, color: 'white' } : { background: colorClasses.bg, color: colorClasses.text })
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
        }} onClick={onClose}>
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                width: '90%',
                maxWidth: '500px',
                padding: '1.5rem',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                position: 'relative'
            }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: '600', color: 'var(--text-main)' }}>Activity Details</h3>
                    <button onClick={onClose} style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#6B7280',
                        padding: '0.25rem'
                    }}>
                        <i className="ri-close-line" style={{ fontSize: '1.25rem' }}></i>
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={iconStyle}>
                        <i className={activity.icon}></i>
                    </div>
                    <div>
                        <p style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>
                            <strong style={{ color: 'var(--text-main)' }}>{activity.user}</strong> {activity.action} <strong style={{ color: 'var(--primary-color)' }}>{activity.target}</strong>
                        </p>
                        <span style={{ fontSize: '0.875rem', color: '#6B7280' }}>
                            {new Date(activity.time).toLocaleString()}
                        </span>
                    </div>
                </div>

                <div style={{ background: 'var(--bg-main)', padding: '1rem', borderRadius: '0.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Type</span>
                            <span style={{ fontWeight: '500', textTransform: 'capitalize', color: 'var(--text-main)' }}>{activity.type}</span>
                        </div>
                        {activity.details && (
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>Details</span>
                                <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{activity.details}</span>
                            </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#6B7280', fontSize: '0.875rem' }}>ID</span>
                            <span style={{ fontWeight: '500', fontFamily: 'monospace', fontSize: '0.8125rem', color: 'var(--text-main)' }}>{activity.id}</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
                    <button onClick={onClose} style={{
                        padding: '0.625rem 1.25rem',
                        background: '#2563EB',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: '500'
                    }}>
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ActivityDetailsModal;
