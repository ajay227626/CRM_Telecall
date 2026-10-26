import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import UserManagement from '../components/Settings/UserManagement';
import CallingSettings from '../components/Settings/CallingSettings';
import APISettings from '../components/Settings/APISettings';
import LeadSettings from '../components/Settings/LeadSettings';
import SystemSettings from '../components/Settings/SystemSettings';
import SettingsTemplates from '../components/Settings/SettingsTemplates';
import MetaIntegrationsSettings from '../components/Settings/MetaIntegrationsSettings';
import { hasPermission, PERMISSIONS } from '../utils/permissions';

const Settings = () => {
    const { t } = useTranslation();

    const allTabs = [
        { id: 'user', labelKey: 'settings.userManagement', icon: 'ri-group-line', permission: PERMISSIONS.VIEW_USERS },
        { id: 'templates', labelKey: 'settings.templates', icon: 'ri-file-settings-line', permission: PERMISSIONS.MANAGE_TEMPLATES },
        { id: 'calling', labelKey: 'settings.callSettings', icon: 'ri-phone-line', permission: PERMISSIONS.MANAGE_SETTINGS },
        { id: 'api', labelKey: 'settings.apiSettings', icon: 'ri-key-2-line', permission: PERMISSIONS.MANAGE_SETTINGS },
        { id: 'lead', labelKey: 'settings.leadSettings', icon: 'ri-user-settings-line', permission: PERMISSIONS.MANAGE_TEMPLATES },
        { id: 'integrations', labelKey: 'settings.metaIntegrations', icon: 'ri-facebook-fill', permission: PERMISSIONS.MANAGE_SETTINGS },
        { id: 'system', labelKey: 'settings.systemSettings', icon: 'ri-settings-4-line', permission: PERMISSIONS.MANAGE_SYSTEM_SETTINGS }
    ];

    const tabs = allTabs.filter(tab => !tab.permission || hasPermission(tab.permission));

    const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].id : '');

    const renderContent = () => {
        switch (activeTab) {
            case 'user': return <UserManagement />;
            case 'templates': return <SettingsTemplates />;
            case 'calling': return <CallingSettings />;
            case 'api': return <APISettings />;
            case 'lead': return <LeadSettings />;
            case 'integrations': return <MetaIntegrationsSettings />;
            case 'system': return <SystemSettings />;
            default: return <UserManagement />;
        }
    };

    return (
        <div className="settings-container">
            {/* Beautified Header */}
            <div style={{
                background: 'linear-gradient(135deg, var(--primary) 0%, color-mix(in srgb, var(--primary) 80%, #000) 100%)',
                borderRadius: '1rem',
                padding: '2rem',
                boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backdropFilter: 'blur(10px)'
                    }}>
                        <i className="ri-settings-3-line" style={{ fontSize: '28px', color: 'white' }}></i>
                    </div>
                    <div>
                        <h1 style={{
                            margin: 0,
                            color: 'white',
                            fontWeight: '700',
                            fontSize: '1.75rem',
                            letterSpacing: '-0.5px'
                        }}>{t('settings.title')}</h1>
                        <p style={{
                            margin: '0.25rem 0 0 0',
                            color: 'rgba(255,255,255,0.8)',
                            fontSize: '0.9375rem'
                        }}>{t('settings.subtitle') || 'Configure your CRM system settings and preferences.'}</p>
                    </div>
                </div>
            </div>

            {/* Beautified Tabs */}
            <div style={{
                display: 'flex',
                gap: '0.75rem',
                background: 'var(--bg-card)',
                padding: '0.75rem',
                borderRadius: '0.875rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                flexWrap: 'wrap'
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            padding: '0.625rem 1.25rem',
                            borderRadius: '0.625rem',
                            border: 'none',
                            background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                            color: activeTab === tab.id ? 'white' : '#6b7280',
                            fontWeight: '600',
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTab !== tab.id) {
                                e.currentTarget.style.background = 'var(--primary-light)';
                                e.currentTarget.style.color = 'var(--primary)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (activeTab !== tab.id) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#6b7280';
                            }
                        }}
                    >
                        <i className={tab.icon} style={{ fontSize: '1.125rem' }}></i>
                        <span style={{
                            display: 'block',
                            whiteSpace: 'nowrap'
                        }}>{t(tab.labelKey)}</span>
                    </button>
                ))}
            </div>

            <div className="settings-main">
                {renderContent()}
            </div>
        </div>
    );
};

export default Settings;
