import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MetaIntegration = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/meta/status`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setStatus(response.data);
        } catch (error) {
            console.error('Failed to load Meta status', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConnect = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/meta/auth-url`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });

            // Redirect to Meta OAuth
            window.location.href = response.data.authUrl;
        } catch (error) {
            console.error('Failed to get auth URL', error);
            alert('Failed to connect to Meta');
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Are you sure you want to disconnect your Meta account?')) {
            return;
        }

        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/meta/disconnect`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            await loadStatus();
            alert('Meta account disconnected');
        } catch (error) {
            console.error('Failed to disconnect', error);
            alert('Failed to disconnect Meta account');
        }
    };

    const handleSync = async () => {
        try {
            setSyncing(true);
            await axios.post(
                `${import.meta.env.VITE_API_URL}/api/meta/sync`,
                {},
                { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            await loadStatus();
            alert('Sync completed successfully');
        } catch (error) {
            console.error('Sync failed', error);
            alert('Failed to sync leads');
        } finally {
            setSyncing(false);
        }
    };

    if (loading) {
        return (
            <div style={{ padding: '2rem', textAlign: 'center' }}>
                <i className="ri-loader-4-line spin" style={{ fontSize: '32px', color: 'var(--primary)' }}></i>
                <p>Loading integration status...</p>
            </div>
        );
    }

    if (!status?.connected) {
        return (
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                <div style={{ textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        margin: '0 auto 1.5rem',
                        background: 'linear-gradient(135deg, #1877f2, #0a5fd7)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 16px rgba(24, 119, 242, 0.3)'
                    }}>
                        <i className="ri-facebook-fill" style={{ fontSize: '40px', color: 'white' }}></i>
                    </div>

                    <h3 style={{ marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                        Connect Meta Lead Ads
                    </h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                        Automatically sync leads from your Facebook and Instagram ad campaigns directly into your CRM.
                    </p>

                    <div style={{
                        background: 'var(--bg-hover)',
                        padding: '1.25rem',
                        borderRadius: '0.75rem',
                        marginBottom: '1.5rem',
                        textAlign: 'left'
                    }}>
                        <h4 style={{ fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.75rem', color: 'var(--text-main)' }}>
                            <i className="ri-check-line" style={{ color: '#10b981', marginRight: '0.25rem' }}></i>
                            What you'll get:
                        </h4>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
                            <li>Real-time lead notifications</li>
                            <li>Automatic lead import from all your pages</li>
                            <li>No manual data entry required</li>
                            <li>Track lead source and campaign</li>
                        </ul>
                    </div>

                    <button
                        onClick={handleConnect}
                        style={{
                            width: '100%',
                            padding: '0.875rem 1.5rem',
                            background: 'linear-gradient(135deg, #1877f2, #0a5fd7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.5rem',
                            fontSize: '1rem',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(24, 119, 242, 0.3)'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                        <i className="ri-facebook-fill" style={{ fontSize: '20px' }}></i>
                        Connect Meta Account
                    </button>

                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
                        You'll be redirected to Facebook to authorize access
                    </p>
                </div>
            </div>
        );
    }

    // Connected state
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Status Card */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '1rem',
                padding: '1.5rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                border: '2px solid #10b981'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <div style={{
                                width: '48px',
                                height: '48px',
                                background: 'linear-gradient(135deg, #1877f2, #0a5fd7)',
                                borderRadius: '12px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <i className="ri-facebook-fill" style={{ fontSize: '24px', color: 'white' }}></i>
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.125rem', color: 'var(--text-main)' }}>
                                    Meta Account Connected
                                </h3>
                                <p style={{ margin: 0, fontSize: '0.875rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                    <i className="ri-checkbox-circle-fill"></i>
                                    Active
                                </p>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                            onClick={handleSync}
                            disabled={syncing}
                            style={{
                                padding: '0.5rem 1rem',
                                background: 'var(--primary)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: syncing ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.375rem',
                                opacity: syncing ? 0.6 : 1
                            }}
                        >
                            <i className={syncing ? "ri-loader-4-line spin" : "ri-refresh-line"}></i>
                            {syncing ? 'Syncing...' : 'Sync Now'}
                        </button>
                        <button
                            onClick={handleDisconnect}
                            style={{
                                padding: '0.5rem 1rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.5rem',
                                fontSize: '0.875rem',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            Disconnect
                        </button>
                    </div>
                </div>

                {status.lastSyncAt && (
                    <p style={{ margin: '1rem 0 0 0', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                        <i className="ri-time-line"></i> Last synced: {new Date(status.lastSyncAt).toLocaleString()}
                    </p>
                )}
            </div>

            {/* Stats Card */}
            {status.stats && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>
                        Sync Statistics
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Leads Synced</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                {status.stats.totalLeadsSynced || 0}
                            </p>
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Connected Pages</p>
                            <p style={{ margin: '0.25rem 0 0 0', fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                                {status.pages?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Connected Pages */}
            {status.pages && status.pages.length > 0 && (
                <div style={{
                    background: 'var(--bg-card)',
                    borderRadius: '1rem',
                    padding: '1.5rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', color: 'var(--text-main)' }}>
                        Connected Pages ({status.pages.length})
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {status.pages.map((page, index) => (
                            <div
                                key={index}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    padding: '1rem',
                                    background: 'var(--bg-hover)',
                                    borderRadius: '0.5rem'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <i className="ri-pages-line" style={{ fontSize: '20px', color: 'var(--primary)' }}></i>
                                    <div>
                                        <p style={{ margin: 0, fontWeight: '600', fontSize: '0.9375rem', color: 'var(--text-main)' }}>
                                            {page.pageName}
                                        </p>
                                        <p style={{ margin: '0.125rem 0 0 0', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                            {page.formsCount} form{page.formsCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    {page.webhookSubscribed ? (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#10b981',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            <i className="ri-checkbox-circle-fill"></i> Active
                                        </span>
                                    ) : (
                                        <span style={{
                                            fontSize: '0.75rem',
                                            color: '#f59e0b',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.25rem'
                                        }}>
                                            <i className="ri-error-warning-fill"></i> Not subscribed
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MetaIntegration;
