import React from 'react';
import toast from 'react-hot-toast';

const notify = {
    success: (message) => toast.success(message, {
        iconTheme: {
            primary: '#059669',
            secondary: '#fff',
        },
    }),
    error: (message) => toast.error(message, {
        iconTheme: {
            primary: '#DC2626',
            secondary: '#fff',
        },
    }),
    loading: (message) => toast.loading(message),
    dismiss: (toastId) => toast.dismiss(toastId),
    custom: (message, icon) => toast(message, { icon }),
    confirm: (message, onConfirm, onCancel) => {
        toast((t) => (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', minWidth: '250px' }}>
                <div style={{ fontWeight: '500', color: 'var(--text-main, #333)' }}>
                    {message}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (onCancel) onCancel();
                        }}
                        style={{
                            padding: '0.25rem 0.75rem',
                            border: '1px solid #e5e7eb',
                            borderRadius: '0.375rem',
                            background: 'white',
                            color: '#6b7280',
                            fontSize: '0.875rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => {
                            toast.dismiss(t.id);
                            if (onConfirm) onConfirm();
                        }}
                        style={{
                            padding: '0.25rem 0.75rem',
                            border: 'none',
                            borderRadius: '0.375rem',
                            background: '#dc2626',
                            color: 'white',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            fontWeight: '500'
                        }}
                    >
                        Confirm
                    </button>
                </div>
            </div>
        ), {
            duration: 8000, // Longer duration for confirmation
            style: {
                background: 'var(--bg-card, #fff)',
                border: '1px solid var(--border, #e5e7eb)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }
        });
    },
};

export default notify;
