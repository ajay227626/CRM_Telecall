import React from 'react';

const StatCard = ({ title, value, subtext, trend, icon, active, onClick, color }) => {
    return (
        <div
            className={`stat-card dashboard-card ${active ? 'active' : ''}`}
            onClick={onClick}
        >
            <div className="card-top">
                <div className="card-info">
                    <span className="card-title">{title}</span>
                    <span className="card-value">{value}</span>
                    <div className="card-trend">
                        {trend !== undefined && trend !== null && (
                            <span className={`trend-value ${trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral'}`}>
                                {trend > 0 ? <i className="ri-arrow-up-line" style={{ fontSize: '14px' }}></i> :
                                    trend < 0 ? <i className="ri-arrow-down-line" style={{ fontSize: '14px' }}></i> :
                                        <i className="ri-subtract-line" style={{ fontSize: '14px' }}></i>}
                                {Math.abs(trend)}%
                            </span>
                        )}
                        <span className="trend-text">{subtext}</span>
                    </div>
                </div>
                <div className="card-icon-wrapper" style={{ backgroundColor: `${color}15`, color: color }}>
                    {icon}
                </div>
            </div>
            {active && <div className="card-indicator" style={{ backgroundColor: color }}></div>}
        </div>
    );
};

export default StatCard;
