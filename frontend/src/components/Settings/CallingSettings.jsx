import React, { useState, useEffect } from 'react';
import { getSettings, saveSettings, getEffectiveSettings } from '../../utils/api';
import { getUser } from '../../utils/permissions';
import SectionHeader from './SectionHeader';

const CallingSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [sources, setSources] = useState({}); // To track inheritance sources

    const [maskedParams, setMaskParams] = useState({
        display: '',
        callback: '',
        enabled: true,
        nameMasking: false, // Show only Lead ID
    });

    const [twilio, setTwilio] = useState({
        sid: '',
        token: '',
        phone: ''
    });

    const [callSettings, setCallSettings] = useState({
        maxDuration: 30,
        callTimeout: 30,
        recording: true,
        autoTranscription: true
    });

    const [privacyControls, setPrivacyControls] = useState({
        showMobile: true,
        showEmail: true,
        showAddress: true,
        allowDirectCall: true,
        allowWhatsApp: true,
        allowEmailing: true
    });

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const user = getUser();
            const data = await getEffectiveSettings(user.id, 'calling');

            if (data && data.config) {
                const config = data.config;
                if (config.maskedParams) setMaskParams({ ...maskedParams, ...config.maskedParams });
                if (config.twilio) setTwilio({ ...twilio, ...config.twilio });
                if (config.callSettings) setCallSettings({ ...callSettings, ...config.callSettings });
                if (config.privacyControls) setPrivacyControls({ ...privacyControls, ...config.privacyControls });

                if (data.sources) setSources(data.sources);
            }
        } catch (err) {
            console.error(err);
            showToast('Failed to load calling configurations', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await saveSettings('calling', {
                maskedParams,
                twilio,
                callSettings,
                privacyControls
            });
            showToast('Calling & Privacy settings updated!', 'success');
        } catch (err) {
            showToast('Failed to sync settings', 'error');
        } finally {
            setSaving(false);
        }
    };

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <i className="ri-loader-4-line spin" style={{ fontSize: '2rem', color: 'var(--primary)' }}></i>
                <span className="ml-3 font-medium">Fetching calling protocols...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Toast Notification */}
            {toast && (
                <div className={`toast ${toast.type}`}>
                    <i className={toast.type === 'success' ? 'ri-checkbox-circle-line' : 'ri-error-warning-line'}></i>
                    {toast.message}
                </div>
            )}

            {/* Inheritance Badge Area */}
            {Object.values(sources || {}).some(id => id) && (
                <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--border)', borderRadius: '0.5rem', padding: '0.75rem', fontSize: '0.875rem', color: '#3b82f6', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            {/* Masked Calling */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-spy-line"
                    title="Stealth Mode & Masking"
                    subtitle="Override real agent numbers with virtual identities"
                    action={(
                        <label className="switch">
                            <input type="checkbox" checked={maskedParams.enabled} onChange={() => setMaskParams({ ...maskedParams, enabled: !maskedParams.enabled })} />
                            <span className="slider"></span>
                        </label>
                    )}
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Virtual Display Identity</label>
                        <input type="text" value={maskedParams.display} onChange={(e) => setMaskParams({ ...maskedParams, display: e.target.value })} placeholder="+1-800-HIDDEN" />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Agent Bridge Number</label>
                        <input type="text" value={maskedParams.callback} onChange={(e) => setMaskParams({ ...maskedParams, callback: e.target.value })} placeholder="+91-XXXXX-XXXXX" />
                    </div>
                </div>
            </div>

            {/* Operator Data Restriction */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-shield-user-line"
                    title="Operator Data Restriction"
                    subtitle="Control data visibility and channel privileges"
                    color="#8B5CF6"
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem' }}>
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center bg-main p-3 rounded-lg border border-border">
                            <div>
                                <h4 className="font-bold text-sm">Identity Masking</h4>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Show only Lead ID (Hide names).</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={maskedParams.nameMasking}
                                    onChange={() => setMaskParams({ ...maskedParams, nameMasking: !maskedParams.nameMasking })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                        <div className="settings-section-title px-0 border-0 mb-0 mt-2" style={{ marginBottom: '0' }}>Visible Data Fields</div>
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center text-sm">
                                <span>Mobile Numbers</span>
                                <label className="switch switch-sm">
                                    <input type="checkbox" checked={privacyControls.showMobile} onChange={() => setPrivacyControls({ ...privacyControls, showMobile: !privacyControls.showMobile })} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Email Addresses</span>
                                <label className="switch switch-sm">
                                    <input type="checkbox" checked={privacyControls.showEmail} onChange={() => setPrivacyControls({ ...privacyControls, showEmail: !privacyControls.showEmail })} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span>Home/Office Address</span>
                                <label className="switch switch-sm">
                                    <input type="checkbox" checked={privacyControls.showAddress} onChange={() => setPrivacyControls({ ...privacyControls, showAddress: !privacyControls.showAddress })} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="settings-section-title px-0 border-0 mb-0" style={{ marginBottom: '0' }}>Communication Privilege</div>
                        <div className="flex flex-col gap-3">
                            <div className="flex justify-between items-center bg-primary-light p-3 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-xs">Direct Calling</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Allow 1-click PSTN calls.</p>
                                </div>
                                <label className="switch switch-sm">
                                    <input type="checkbox" checked={privacyControls.allowDirectCall} onChange={() => setPrivacyControls({ ...privacyControls, allowDirectCall: !privacyControls.allowDirectCall })} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="flex justify-between items-center bg-primary-light p-3 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-xs">WhatsApp Business</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Enable WhatsApp API triggers.</p>
                                </div>
                                <label className="switch switch-sm">
                                    <input type="checkbox" checked={privacyControls.allowWhatsApp} onChange={() => setPrivacyControls({ ...privacyControls, allowWhatsApp: !privacyControls.allowWhatsApp })} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                            <div className="flex justify-between items-center bg-primary-light p-3 rounded-lg">
                                <div>
                                    <h4 className="font-bold text-xs">Email Integration</h4>
                                    <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Allow sending emails to leads.</p>
                                </div>
                                <label className="switch switch-sm">
                                    <input type="checkbox" checked={privacyControls.allowEmailing} onChange={() => setPrivacyControls({ ...privacyControls, allowEmailing: !privacyControls.allowEmailing })} />
                                    <span className="slider"></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Twilio Integration */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-customer-service-2-line"
                    title="Twilio Provider Trunk"
                    subtitle="Configure telecommunication gateway credentials"
                    color="#F22F46"
                    action={(
                        <button className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}>
                            <i className="ri-eye-line mr-2"></i> Reveal Secret Keys
                        </button>
                    )}
                />

                <div className="settings-grid-2" style={{ padding: '1.5rem', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Account SID</label>
                        <input type="text" value={twilio.sid} onChange={(e) => setTwilio({ ...twilio, sid: e.target.value })} placeholder="AC..." />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Access Token</label>
                        <input type="password" value={twilio.token} onChange={(e) => setTwilio({ ...twilio, token: e.target.value })} placeholder="••••••••" />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <label>Outgoing Number</label>
                        <input type="text" value={twilio.phone} onChange={(e) => setTwilio({ ...twilio.phone, phone: e.target.value })} placeholder="+1234567890" />
                    </div>
                    <div className="form-group" style={{ marginBottom: '0' }}>
                        <button className="btn btn-primary" style={{ width: '100%', backgroundColor: '#F22F46' }}>
                            <i className="ri-phone-fill mr-2"></i> Heartbeat Test
                        </button>
                    </div>
                </div>
            </div>

            {/* Call Settings Sliders */}
            <div className="card" style={{ padding: 0, borderRadius: '1rem', overflow: 'hidden', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                <SectionHeader
                    icon="ri-equalizer-line"
                    title="Channel Parameters"
                    subtitle="Fine-tune call limits and feedback loops"
                />

                <div style={{ padding: '1.5rem' }}>
                    <div className="settings-grid-2 mb-6">
                        <div className="form-group" style={{ marginBottom: '0' }}>
                            <label>Max Session Limit: {callSettings.maxDuration} min</label>
                            <input
                                type="range"
                                min="5"
                                max="60"
                                value={callSettings.maxDuration}
                                onChange={(e) => setCallSettings({ ...callSettings, maxDuration: parseInt(e.target.value) })}
                                style={{
                                    margin: '0.5rem 0',
                                    background: `linear-gradient(to right, var(--primary) ${(callSettings.maxDuration - 5) * 100 / (60 - 5)}%, #e5e7eb ${(callSettings.maxDuration - 5) * 100 / (60 - 5)}%)`
                                }}
                            />
                        </div>
                        <div className="form-group" style={{ marginBottom: '0' }}>
                            <label>Ringing Timeout: {callSettings.callTimeout}s</label>
                            <input
                                type="range"
                                min="15"
                                max="60"
                                value={callSettings.callTimeout}
                                onChange={(e) => setCallSettings({ ...callSettings, callTimeout: parseInt(e.target.value) })}
                                style={{
                                    margin: '0.5rem 0',
                                    background: `linear-gradient(to right, var(--primary) ${(callSettings.callTimeout - 15) * 100 / (60 - 15)}%, #e5e7eb ${(callSettings.callTimeout - 15) * 100 / (60 - 15)}%)`
                                }}
                            />
                        </div>
                    </div>

                    <div className="settings-section-title" style={{ marginBottom: '0' }}>Automation & Compliance</div>
                    <div className="settings-grid-cols-1 divide-y divide-gray-100">
                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-main text-sm">Force Recording</h4>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Record all voice traffic automatically.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={callSettings.recording}
                                    onChange={() => setCallSettings({ ...callSettings, recording: !callSettings.recording })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>

                        <div className="flex justify-between items-center py-4">
                            <div>
                                <h4 className="font-bold text-main text-sm">AI Transcription</h4>
                                <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Real-time speech-to-text analysis.</p>
                            </div>
                            <label className="switch">
                                <input
                                    type="checkbox"
                                    checked={callSettings.autoTranscription}
                                    onChange={() => setCallSettings({ ...callSettings, autoTranscription: !callSettings.autoTranscription })}
                                />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <button className="btn btn-primary" style={{ padding: '0.875rem 3rem' }} onClick={handleSave} disabled={saving}>
                    {saving ? (
                        <><i className="ri-loader-4-line spin mr-2"></i> Persisting...</>
                    ) : (
                        <><i className="ri-save-line mr-2"></i> Update Signaling Config</>
                    )}
                </button>
            </div>
        </div >
    );
};

export default CallingSettings;
