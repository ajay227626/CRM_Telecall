import React from 'react';

/**
 * A reusable section header component for settings pages
 * Uses brand accent color with gradient styling
 */
const SectionHeader = ({
    icon,
    title,
    subtitle,
    action,
    color = 'var(--primary)'
}) => {
    return (
        <div style={{
            padding: '1.25rem 1.5rem',
            background: color,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 0,
            borderRadius: '1rem 1rem 0 0'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {icon && (
                    <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '12px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className={icon} style={{ fontSize: '22px', color: 'white' }}></i>
                    </div>
                )}
                <div>
                    <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.125rem' }}>{title}</h3>
                    {subtitle && (
                        <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.8125rem' }}>{subtitle}</p>
                    )}
                </div>
            </div>
            {action && (
                <div>{action}</div>
            )}
        </div>
    );
};

export default SectionHeader;
