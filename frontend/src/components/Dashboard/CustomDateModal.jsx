import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import useEscapeKey from '../../hooks/useEscapeKey';

const CustomDateModal = ({ onClose, onApply }) => {
    useEscapeKey(onClose);

    const [selectedOption, setSelectedOption] = useState('lastDays');
    const [lastDays, setLastDays] = useState('7');
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    // Calculate max "from date" based on "to date" and vice versa
    const getMaxFromDate = () => toDate || today;
    const getMinToDate = () => fromDate || '';

    // Check if confirm button should be enabled
    const isConfirmEnabled = () => {
        switch (selectedOption) {
            case 'lastDays':
                return lastDays && parseInt(lastDays) > 0;
            case 'dateRange':
                return fromDate && toDate && new Date(fromDate) <= new Date(toDate);
            case 'thisWeek':
            case 'thisMonth':
            case 'thisQuarter':
            case 'thisYear':
            case 'lastWeek':
            case 'lastMonth':
            case 'lastQuarter':
            case 'lastYear':
                return true;
            default:
                return false;
        }
    };

    const handleApply = () => {
        let dateRange = {};
        const now = new Date();

        switch (selectedOption) {
            case 'lastDays':
                const daysAgo = new Date();
                daysAgo.setDate(daysAgo.getDate() - parseInt(lastDays));
                dateRange = { from: daysAgo, to: now, label: `Last ${lastDays} days` };
                break;
            case 'dateRange':
                dateRange = { from: new Date(fromDate), to: new Date(toDate), label: `${fromDate} to ${toDate}` };
                break;
            case 'thisWeek':
                const startOfWeek = new Date(now);
                startOfWeek.setDate(now.getDate() - now.getDay());
                dateRange = { from: startOfWeek, to: now, label: 'This Week' };
                break;
            case 'thisMonth':
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                dateRange = { from: startOfMonth, to: now, label: 'This Month' };
                break;
            case 'thisQuarter':
                const quarter = Math.floor(now.getMonth() / 3);
                const startOfQuarter = new Date(now.getFullYear(), quarter * 3, 1);
                dateRange = { from: startOfQuarter, to: now, label: 'This Quarter' };
                break;
            case 'thisYear':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                dateRange = { from: startOfYear, to: now, label: 'This Year' };
                break;
            case 'lastWeek':
                const lastWeekEnd = new Date(now);
                lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
                const lastWeekStart = new Date(lastWeekEnd);
                lastWeekStart.setDate(lastWeekEnd.getDate() - 6);
                dateRange = { from: lastWeekStart, to: lastWeekEnd, label: 'Last Week' };
                break;
            case 'lastMonth':
                const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                dateRange = { from: lastMonthStart, to: lastMonthEnd, label: 'Last Month' };
                break;
            case 'lastQuarter':
                const lastQ = Math.floor(now.getMonth() / 3) - 1;
                const year = lastQ < 0 ? now.getFullYear() - 1 : now.getFullYear();
                const adjustedQ = lastQ < 0 ? 3 : lastQ;
                const lqStart = new Date(year, adjustedQ * 3, 1);
                const lqEnd = new Date(year, adjustedQ * 3 + 3, 0);
                dateRange = { from: lqStart, to: lqEnd, label: 'Last Quarter' };
                break;
            case 'lastYear':
                const lyStart = new Date(now.getFullYear() - 1, 0, 1);
                const lyEnd = new Date(now.getFullYear() - 1, 11, 31);
                dateRange = { from: lyStart, to: lyEnd, label: 'Last Year' };
                break;
            default:
                break;
        }

        onApply(dateRange);
        onClose();
    };

    const presetOptions = [
        { id: 'thisWeek', label: 'This Week', icon: 'ri-calendar-line' },
        { id: 'thisMonth', label: 'This Month', icon: 'ri-calendar-2-line' },
        { id: 'thisQuarter', label: 'This Quarter', icon: 'ri-calendar-check-line' },
        { id: 'thisYear', label: 'This Year', icon: 'ri-calendar-event-line' },
        { id: 'lastWeek', label: 'Last Week', icon: 'ri-history-line' },
        { id: 'lastMonth', label: 'Last Month', icon: 'ri-time-line' },
        { id: 'lastQuarter', label: 'Last Quarter', icon: 'ri-timer-line' },
        { id: 'lastYear', label: 'Last Year', icon: 'ri-archive-line' },
    ];

    const modalContent = (
        <div className="modal-overlay" style={{ zIndex: 10000 }}>
            <div style={{
                width: '500px',
                maxWidth: '95vw',
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden'
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem',
                    background: 'var(--primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(255, 255, 255, 0.2)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <i className="ri-calendar-schedule-line" style={{ fontSize: '22px', color: 'white' }}></i>
                        </div>
                        <div>
                            <h3 style={{ margin: 0, color: 'white', fontWeight: '700', fontSize: '1.25rem' }}>Custom Date Range</h3>
                            <p style={{ margin: 0, color: 'rgba(255,255,255,0.8)', fontSize: '0.875rem' }}>Select time period for chart data</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            border: 'none',
                            background: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <i className="ri-close-line" style={{ fontSize: '20px' }}></i>
                    </button>
                </div>

                <div style={{ padding: '1.5rem' }}>
                    {/* Option 1: Last X Days */}
                    <div
                        onClick={() => setSelectedOption('lastDays')}
                        style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            border: selectedOption === 'lastDays' ? '2px solid var(--primary)' : '2px solid #e5e7eb',
                            background: selectedOption === 'lastDays' ? 'var(--primary-light, rgba(59, 130, 246, 0.1))' : 'var(--bg-card)',
                            marginBottom: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: selectedOption === 'lastDays' ? '6px solid var(--primary)' : '2px solid #d1d5db',
                                background: 'white'
                            }}></div>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Last X Days</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '2rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>Last</span>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={lastDays}
                                onChange={(e) => setLastDays(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                placeholder="7"
                                style={{
                                    width: '80px',
                                    padding: '0.5rem 0.75rem',
                                    border: '2px solid var(--border, #e5e7eb)',
                                    borderRadius: '0.5rem',
                                    fontSize: '0.9375rem',
                                    textAlign: 'center',
                                    outline: 'none',
                                    background: 'var(--bg-card)',
                                    color: 'var(--text-main)'
                                }}
                            />
                            <span style={{ color: 'var(--text-secondary)' }}>day(s)</span>
                        </div>
                    </div>

                    {/* Option 2: Date Range */}
                    <div
                        onClick={() => setSelectedOption('dateRange')}
                        style={{
                            padding: '1rem',
                            borderRadius: '0.75rem',
                            border: selectedOption === 'dateRange' ? '2px solid var(--primary)' : '2px solid #e5e7eb',
                            background: selectedOption === 'dateRange' ? 'var(--primary-light, rgba(59, 130, 246, 0.1))' : 'var(--bg-card)',
                            marginBottom: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                            <div style={{
                                width: '20px',
                                height: '20px',
                                borderRadius: '50%',
                                border: selectedOption === 'dateRange' ? '6px solid var(--primary)' : '2px solid #d1d5db',
                                background: 'white'
                            }}></div>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>Custom Date Range</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '2rem', flexWrap: 'wrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>From:</span>
                                <input
                                    type="date"
                                    value={fromDate}
                                    max={getMaxFromDate()}
                                    onChange={(e) => setFromDate(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        border: '2px solid var(--border, #e5e7eb)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-main)'
                                    }}
                                />
                            </div>
                            <i className="ri-arrow-right-line" style={{ color: '#9ca3af' }}></i>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <span style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>To:</span>
                                <input
                                    type="date"
                                    value={toDate}
                                    min={getMinToDate()}
                                    max={today}
                                    onChange={(e) => setToDate(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{
                                        padding: '0.5rem 0.75rem',
                                        border: '2px solid var(--border, #e5e7eb)',
                                        borderRadius: '0.5rem',
                                        fontSize: '0.875rem',
                                        outline: 'none',
                                        background: 'var(--bg-card)',
                                        color: 'var(--text-main)'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Option 3: Quick Presets */}
                    <div style={{ marginBottom: '1rem' }}>
                        <p style={{
                            fontSize: '0.75rem',
                            fontWeight: '600',
                            color: '#6b7280',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginBottom: '0.75rem'
                        }}>
                            Quick Presets
                        </p>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '0.5rem'
                        }}>
                            {presetOptions.map(preset => (
                                <button
                                    key={preset.id}
                                    onClick={() => setSelectedOption(preset.id)}
                                    style={{
                                        padding: '0.625rem 0.5rem',
                                        borderRadius: '0.5rem',
                                        border: selectedOption === preset.id ? '2px solid var(--primary)' : '1px solid #e5e7eb',
                                        background: selectedOption === preset.id ? 'var(--primary)' : 'var(--bg-card)',
                                        color: selectedOption === preset.id ? 'white' : '#374151',
                                        cursor: 'pointer',
                                        fontSize: '0.75rem',
                                        fontWeight: '500',
                                        transition: 'all 0.2s',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '0.25rem'
                                    }}
                                >
                                    <i className={preset.icon} style={{ fontSize: '16px' }}></i>
                                    {preset.label}
                                </button>
                            ))}
                        </div>
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
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: 'var(--bg-card)',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '0.5rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleApply}
                        disabled={!isConfirmEnabled()}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: isConfirmEnabled() ? 'var(--primary)' : '#e5e7eb',
                            color: isConfirmEnabled() ? 'white' : '#9ca3af',
                            border: 'none',
                            borderRadius: '0.5rem',
                            cursor: isConfirmEnabled() ? 'pointer' : 'not-allowed',
                            fontWeight: '600',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <i className="ri-check-line"></i>
                        Apply Range
                    </button>
                </div>
            </div>
        </div>
    );

    return ReactDOM.createPortal(modalContent, document.body);
};

export default CustomDateModal;
