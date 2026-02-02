import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getEffectiveSettings } from '../../utils/api';
import notify from '../../utils/toast.jsx';
import { useAppearance } from '../../context/AppearanceContext';
import { getUser } from '../../utils/permissions';
import SectionHeader from './SectionHeader';
import { TIMEZONES, REGIONS, LANGUAGES, DATE_FORMATS, CURRENCIES, FONT_FAMILIES } from '../../constants/settingsOptions';

const SystemSettings = () => {
    const { updateAppearance, updateGeneral } = useAppearance();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [general, setGeneral] = useState({
        companyName: 'CRM Pro',
        timezone: 'UTC+05:30',
        dateFormat: 'DD/MM/YYYY',
        currency: 'INR',
        region: 'India',
        language: 'en-IN',
        timeFormat: '24h',
        numberFormat: 'Indian'
    });

    const [appearance, setAppearance] = useState({
        theme: 'light',
        sidebarStyle: 'modern',
        primaryColor: '#10B981',
        fontSize: 'medium',
        fontFamily: 'Inter'
    });

    const [notifications, setNotifications] = useState({
        email: true,
        sms: false,
        desktop: true,
        sound: true
    });

    const [security, setSecurity] = useState({
        sessionTimeout: '30',
        dataRetention: '365',
        twoFactor: false,
        screenProtection: false
    });

    const [sources, setSources] = useState({}); // To track inheritance sources

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const user = getUser();
            const data = await getEffectiveSettings(user.id, 'system');

            if (data && data.config) {
                const config = data.config;
                if (config.general) setGeneral({ ...general, ...config.general });
                if (config.appearance) {
                    const newAppearance = { ...appearance, ...config.appearance };
                    setAppearance(newAppearance);
                }
                if (config.notifications) setNotifications({ ...notifications, ...config.notifications });
                if (config.security) setSecurity({ ...security, ...config.security });

                if (data.sources) setSources(data.sources);
            }
        } catch (err) {
            console.error('Failed to load system settings:', err);
            notify.error('Failed to load system settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await saveSettings('system', {
                general,
                appearance,
                notifications,
                security
            });

            // Update global context state
            updateAppearance(appearance);
            updateGeneral(general);

            // Apply screen protection class
            if (security.screenProtection) {
                document.body.classList.add('privacy-shield');
            } else {
                document.body.classList.remove('privacy-shield');
            }

            notify.success('System configuration synchronized!');
        } catch (err) {
            notify.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };



    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <span className="ml-3 font-medium">Loading system configurations...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Toast removed */}


            {/* Inheritance Badge Area */}
            {Object.values(sources || {}).some(id => id) && (
                <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: '#1e40af', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <i className="ri-information-line"></i>
                    <span>
                        Settings are currently inherited from:
                        {sources.organization && <span className="font-semibold ml-1">Organization</span>}
                        {sources.group && <span className="font-semibold ml-1">Group</span>}
                        {sources.system && <span className="font-semibold ml-1">System</span>}
                        {sources.user && <span className="font-semibold ml-1 text-green-600">(Personal Overrides Active)</span>}
                    </span>
                </div>
            )}

            {/* General & Regional Settings */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-global-line"
                    title="Global & Regional"
                    subtitle="Configure company identity and localization preferences"
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Company Display Name</label>
                        <input
                            type="text"
                            value={general.companyName}
                            onChange={(e) => setGeneral({ ...general, companyName: e.target.value })}
                        />
                        <p className="setting-help">Used in headers, footers and formal exports.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Operations Region</label>
                        <select value={general.region} onChange={(e) => setGeneral({ ...general, region: e.target.value })}>
                            {REGIONS.map(region => (
                                <option key={region.value} value={region.value}>{region.flag} {region.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Interface Language</label>
                        <select value={general.language} onChange={(e) => setGeneral({ ...general, language: e.target.value })}>
                            {LANGUAGES.map(lang => (
                                <option key={lang.value} value={lang.value}>{lang.label}</option>
                            ))}
                        </select>
                        <p className="setting-help">Select your native language for workspace localization.</p>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>System Timezone</label>
                        <select value={general.timezone} onChange={(e) => setGeneral({ ...general, timezone: e.target.value })}>
                            {TIMEZONES.map(tz => (
                                <option key={tz.value} value={tz.value}>{tz.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Date Representation</label>
                        <select value={general.dateFormat} onChange={(e) => setGeneral({ ...general, dateFormat: e.target.value })}>
                            {DATE_FORMATS.map(df => (
                                <option key={df.value} value={df.value}>{df.label}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Clock Format</label>
                        <select value={general.timeFormat} onChange={(e) => setGeneral({ ...general, timeFormat: e.target.value })}>
                            <option value="24h">24 Hour Military (13:45)</option>
                            <option value="12h">12 Hour Standard (01:45 PM)</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Monetary & Number Format</label>
                        <div className="flex gap-2">
                            <select value={general.currency} style={{ flex: 1 }} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}>
                                {CURRENCIES.map(curr => (
                                    <option key={curr.value} value={curr.value}>{curr.label}</option>
                                ))}
                            </select>
                            <select value={general.numberFormat} style={{ flex: 1 }} onChange={(e) => setGeneral({ ...general, numberFormat: e.target.value })}>
                                <option value="Indian">Lakhs (10,00,000)</option>
                                <option value="International">Millions (1,000,000)</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Appearance Customization */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-palette-line"
                    title="Aesthetics & Experience"
                    subtitle="Personalize the interface design and typography"
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Master Theme</label>
                        <div className="flex gap-2">
                            <button
                                className={`btn flex-1 ${appearance.theme === 'light' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setAppearance({ ...appearance, theme: 'light' })}
                            >
                                <i className="ri-sun-line mr-2"></i> Solar Light
                            </button>
                            <button
                                className={`btn flex-1 ${appearance.theme === 'dark' ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setAppearance({ ...appearance, theme: 'dark' })}
                            >
                                <i className="ri-moon-line mr-2"></i> Deep Dark
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Sidebar Navigation Style</label>
                        <select value={appearance.sidebarStyle} onChange={(e) => setAppearance({ ...appearance, sidebarStyle: e.target.value })}>
                            <option value="modern">Modern (Glassmorphism)</option>
                            <option value="classic">Classic (Solid)</option>
                            <option value="minimal">Minimalist (Compact)</option>
                        </select>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Brand Accent Color</label>
                        <div className="flex gap-2 items-center">
                            <div
                                style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '8px',
                                    backgroundColor: appearance.primaryColor,
                                    border: '2px solid #e5e7eb',
                                    cursor: 'pointer',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <input
                                    type="color"
                                    value={appearance.primaryColor}
                                    onChange={(e) => {
                                        const color = e.target.value;
                                        setAppearance({ ...appearance, primaryColor: color });
                                        updateAppearance({ primaryColor: color });
                                    }}
                                    style={{
                                        opacity: 0,
                                        position: 'absolute',
                                        left: 0,
                                        top: 0,
                                        width: '100%',
                                        height: '100%',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                            <input
                                type="text"
                                value={appearance.primaryColor}
                                onChange={(e) => {
                                    const color = e.target.value;
                                    setAppearance({ ...appearance, primaryColor: color });
                                    updateAppearance({ primaryColor: color });
                                }}
                                className="form-input"
                                style={{ width: '100px', textTransform: 'uppercase' }}
                            />
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label>Typography Selection</label>
                        <select value={appearance.fontFamily} onChange={(e) => setAppearance({ ...appearance, fontFamily: e.target.value })}>
                            {FONT_FAMILIES.map(font => (
                                <option key={font.value} value={font.value}>{font.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notification & Security Group */}
            <div className="settings-grid-2">
                <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <SectionHeader
                        icon="ri-notification-3-line"
                        title="Alert Center"
                        subtitle="Manage system alerts and delivery methods"
                        color="#10B981"
                    />
                    <div className="flex flex-col divide-y divide-gray-100" style={{ padding: '0 1.5rem', marginBottom: 0 }}>
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Email Dispatch</h4>
                                <p className="text-xs text-gray-500 mt-1">Mission critical alerts via mail.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={notifications.email}
                                    onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">System Push</h4>
                                <p className="text-xs text-gray-500 mt-1">Browser-level desktop notifications.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={notifications.desktop}
                                    onChange={() => setNotifications({ ...notifications, desktop: !notifications.desktop })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    <SectionHeader
                        icon="ri-shield-user-line"
                        title="Security & Privacy"
                        subtitle="Maintain data integrity and workspace protection"
                        color="#F59E0B"
                    />
                    <div className="flex flex-col divide-y divide-gray-100" style={{ padding: '0 1.5rem', marginBottom: 0 }}>
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Session Lockdown</h4>
                                <p className="text-xs text-gray-500 mt-1">Auto-logout upon inactivity.</p>
                            </div>
                            <select
                                style={{ width: '100px' }}
                                value={security.sessionTimeout}
                                onChange={(e) => setSecurity({ ...security, sessionTimeout: e.target.value })}
                                className="form-select border border-gray-200 rounded-lg p-2 text-sm"
                            >
                                <option value="15">15m</option>
                                <option value="30">30m</option>
                                <option value="60">1h</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">Privacy Shield</h4>
                                <p className="text-xs text-gray-500 mt-1">Restrict screenshots and recordings.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={security.screenProtection}
                                    onChange={() => setSecurity({ ...security, screenProtection: !security.screenProtection })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button
                    className="btn btn-primary"
                    style={{ padding: '0.875rem 3rem', fontSize: '1rem' }}
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <><i className="ri-loader-4-line spin mr-2"></i> Syncing...</>
                    ) : (
                        <><i className="ri-save-line mr-2"></i> Commit Global Changes</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default SystemSettings;
