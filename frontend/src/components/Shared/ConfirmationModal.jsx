import React from 'react';
import { useAppearance } from '../../context/AppearanceContext';

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger' // danger, warning, info
}) => {
    const { theme } = useAppearance();

    if (!isOpen) return null;

    const isDark = theme === 'dark';

    const getIcon = () => {
        switch (type) {
            case 'danger': return 'ri-error-warning-line';
            case 'warning': return 'ri-alert-line';
            case 'info': return 'ri-information-line';
            default: return 'ri-question-line';
        }
    };

    const getColors = () => {
        switch (type) {
            case 'danger': return { icon: '#ef4444', btn: '#ef4444' };
            case 'warning': return { icon: '#f59e0b', btn: '#f59e0b' };
            default: return { icon: '#3b82f6', btn: '#3b82f6' };
        }
    };

    const colors = getColors();

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }} onClick={onClose}>
            <div style={{
                backgroundColor: isDark ? '#1f2937' : '#ffffff',
                borderRadius: '1rem',
                padding: '1.5rem',
                width: '100%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
                transform: 'scale(1)',
                transition: 'transform 0.2s'
            }} onClick={e => e.stopPropagation()}>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                    <div style={{
                        backgroundColor: type === 'danger' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className={getIcon()} style={{
                            fontSize: '1.5rem',
                            color: colors.icon
                        }}></i>
                    </div>

                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            margin: '0 0 0.5rem 0',
                            fontSize: '1.25rem',
                            fontWeight: '600',
                            color: isDark ? '#f3f4f6' : '#111827'
                        }}>
                            {title}
                        </h3>
                        <p style={{
                            margin: 0,
                            color: isDark ? '#9ca3af' : '#6b7280',
                            fontSize: '0.95rem',
                            lineHeight: '1.5'
                        }}>
                            {message}
                        </p>
                    </div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '0.75rem',
                    marginTop: '1.5rem'
                }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: isDark ? '1px solid #374151' : '1px solid #d1d5db',
                            backgroundColor: 'transparent',
                            color: isDark ? '#d1d5db' : '#374151',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            padding: '0.5rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            backgroundColor: colors.btn,
                            color: '#ffffff',
                            fontWeight: '500',
                            cursor: 'pointer',
                            fontSize: '0.875rem',
                            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                        }}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
