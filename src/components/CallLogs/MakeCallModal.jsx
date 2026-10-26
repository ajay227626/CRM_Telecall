import React, { useState, useEffect } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { getLeads } from '../../utils/api';
import { useCall } from '../../context/CallContext';

const MakeCallModal = ({ isOpen, onClose, onCallStart, lead }) => {
    useEscapeKey(onClose);
    const { initiateCallWithLead } = useCall();
    const [step, setStep] = useState(1); // 1: select lead, 2: choose method
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedLead, setSelectedLead] = useState(null);
    const [initiating, setInitiating] = useState(false);

    useEffect(() => {
        loadLeads();
    }, []);

    const loadLeads = async () => {
        try {
            const data = await getLeads();
            setLeads(data);
        } catch (err) {
            console.error('Failed to load leads');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectLead = (lead) => {
        setSelectedLead(lead);
        setStep(2);
    };

    const handleInitiateCall = (callType) => {
        if (!selectedLead) return;

        setInitiating(true);

        // Use CallContext to initiate the call - this will open the dialer and start the call
        initiateCallWithLead(selectedLead, callType);

        // Close the modal and notify parent
        onClose();
        if (onCallStart) {
            onCallStart(selectedLead);
        }

        setInitiating(false);
    };

    const handleWhatsAppCall = () => {
        if (selectedLead?.phone) {
            // Remove non-numeric characters and open WhatsApp
            const phone = selectedLead.phone.replace(/\D/g, '');
            window.open(`https://wa.me/${phone}`, '_blank');
            onCallStart(selectedLead);
        }
    };

    const handleEmailCall = () => {
        if (selectedLead?.email) {
            window.open(`mailto:${selectedLead.email}?subject=Follow up from CRM`, '_blank');
            onCallStart(selectedLead);
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            'New': { bg: '#F3F4F6', text: '#374151' },
            'Contacted': { bg: '#DBEAFE', text: '#1E40AF' },
            'Qualified': { bg: '#FEF3C7', text: '#92400E' },
            'Converted': { bg: '#D1FAE5', text: '#047857' }
        };
        const color = colors[status] || colors['New'];
        return <span className="status-badge" style={{ backgroundColor: color.bg, color: color.text }}>{status}</span>;
    };

    const renderLeadSelection = () => (
        <>
            <div className="modal-header">
                <h3>Make a Call</h3>
                <button onClick={onClose} className="modal-close"><i className="ri-close-line" style={{ fontSize: '20px' }}></i></button>
            </div>
            <div className="modal-body">
                <p className="modal-subtitle">Select a lead to call:</p>

                {loading ? (
                    <div className="loading-state">
                        <i className="ri-loader-4-line spin" style={{ fontSize: '24px' }}></i>
                        <span>Loading leads...</span>
                    </div>
                ) : leads.length === 0 ? (
                    <div className="empty-state">
                        <p>No leads available. Add leads first.</p>
                    </div>
                ) : (
                    <div className="lead-select-list">
                        {leads.slice(0, 10).map(lead => (
                            <div
                                key={lead._id}
                                className="lead-select-item"
                                onClick={() => handleSelectLead(lead)}
                            >
                                <div className="lead-select-info">
                                    <span className="lead-select-name">{lead.name}</span>
                                    <span className="lead-select-details">{lead.phone} • {lead.category}</span>
                                </div>
                                {getStatusBadge(lead.status)}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );

    const renderMethodSelection = () => (
        <>
            <div className="modal-header">
                <h3>Choose Calling Method</h3>
                <button onClick={onClose} className="modal-close"><i className="ri-close-line" style={{ fontSize: '20px' }}></i></button>
            </div>
            <div className="modal-body">
                <div className="selected-lead-card">
                    <span className="label">Calling:</span>
                    <span className="name">{selectedLead.name}</span>
                    <span className="phone">{selectedLead.phone}</span>
                </div>

                <div className="call-method-options">
                    <div
                        className="call-method-card recommended"
                        onClick={() => !initiating && handleInitiateCall('Masked')}
                    >
                        <div className="method-icon green">
                            <i className="ri-shield-star-line" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div className="method-info">
                            <h4>Masked Number Call (Recommended)</h4>
                            <p>Your number will be hidden. Lead sees: +1-800-MASKED</p>
                            <div className="method-badges">
                                <span className="method-badge green">✓ Privacy Protected</span>
                                <span className="method-badge blue">⬤ Auto Recorded</span>
                            </div>
                        </div>
                        <i className="ri-arrow-right-s-line method-arrow" style={{ fontSize: '20px' }}></i>
                    </div>

                    <div
                        className="call-method-card"
                        onClick={() => !initiating && handleInitiateCall('Direct')}
                    >
                        <div className="method-icon yellow">
                            <i className="ri-phone-line" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div className="method-info">
                            <h4>Direct Call</h4>
                            <p>Use your personal number (lead will see your number)</p>
                            <div className="method-badges">
                                <span className="method-badge orange">⊘ Number Visible</span>
                                <span className="method-badge blue">⬤ Instant</span>
                            </div>
                        </div>
                        <i className="ri-arrow-right-s-line method-arrow" style={{ fontSize: '20px' }}></i>
                    </div>

                    <div
                        className="call-method-card"
                        onClick={() => !initiating && handleWhatsAppCall()}
                    >
                        <div className="method-icon whatsapp">
                            <i className="ri-whatsapp-line" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div className="method-info">
                            <h4>WhatsApp Call</h4>
                            <p>Call via WhatsApp with video option</p>
                            <div className="method-badges">
                                <span className="method-badge green">✓ End-to-End Encrypted</span>
                            </div>
                        </div>
                        <i className="ri-arrow-right-s-line method-arrow" style={{ fontSize: '20px' }}></i>
                    </div>

                    <div
                        className="call-method-card"
                        onClick={() => !initiating && handleEmailCall()}
                    >
                        <div className="method-icon email">
                            <i className="ri-mail-line" style={{ fontSize: '24px' }}></i>
                        </div>
                        <div className="method-info">
                            <h4>Send Email</h4>
                            <p>Follow up via email</p>
                            <div className="method-badges">
                                <span className="method-badge blue">📧 Tracked</span>
                            </div>
                        </div>
                        <i className="ri-arrow-right-s-line method-arrow" style={{ fontSize: '20px' }}></i>
                    </div>
                </div>

                <div className="masked-info-box">
                    <div className="info-icon">ℹ️</div>
                    <div className="info-content">
                        <h5>How Masked Calling Works:</h5>
                        <ol>
                            <li>1. We'll call your registered number first</li>
                            <li>2. Once you answer, we'll connect you to the lead</li>
                            <li>3. Lead sees our masked number, not yours</li>
                            <li>4. Call is automatically recorded and logged</li>
                        </ol>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ width: '450px' }}>
                {step === 1 ? renderLeadSelection() : renderMethodSelection()}
            </div>
        </div>
    );
};

export default MakeCallModal;
