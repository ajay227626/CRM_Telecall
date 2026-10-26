import React, { useState, useRef, useEffect } from 'react';
import { queryTelecallerCopilot } from '../../utils/api';
import notify from '../../utils/toast';

const QUICK_OBJECTIONS = [
    'Price is too expensive',
    'Already using a competitor',
    'No budget this quarter',
    'Send details on WhatsApp first',
    'Not interested right now'
];

const CopilotDrawer = ({ isOpen, onClose, currentLead = null }) => {
    const [query, setQuery] = useState('');
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const inputRef = useRef(null);
    const resultRef = useRef(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleAskCopilot = async (overrideQuery = null) => {
        const textToAsk = overrideQuery || query;
        if (!textToAsk || !textToAsk.trim()) return;

        setLoading(true);
        const currentQ = textToAsk.trim();
        setQuery('');

        try {
            const context = currentLead ? {
                leadName: currentLead.name,
                category: currentLead.category,
                status: currentLead.status,
                phone: currentLead.phone
            } : {};

            const res = await queryTelecallerCopilot({
                customerQuery: currentQ,
                currentCallContext: context
            });

            if (res.success && res.advice) {
                setAdvice(res.advice);
                setHistory(prev => [
                    { q: currentQ, a: res.advice, time: new Date().toLocaleTimeString() },
                    ...prev.slice(0, 5)
                ]);
            }
        } catch (err) {
            console.error('Copilot query error:', err);
            notify.error(err.message || 'Copilot query failed');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        notify.success('Copied talking point to clipboard!');
    };

    return (
        <div style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '420px',
            maxWidth: '90vw',
            maxHeight: '580px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '1rem',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <div style={{
                padding: '0.875rem 1rem',
                background: 'linear-gradient(135deg, #1E1B4B, #312E81)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <i className="ri-sparkling-fill" style={{ color: '#FCD34D', fontSize: '16px' }}></i>
                    </div>
                    <div>
                        <h4 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>Telecaller Sales Copilot</h4>
                        <span style={{ fontSize: '0.7rem', color: '#C7D2FE' }}>
                            {currentLead?.name ? `Context: ${currentLead.name}` : 'Real-time AI Guidance'}
                        </span>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    style={{ background: 'transparent', border: 'none', color: '#C7D2FE', cursor: 'pointer', fontSize: '18px' }}
                >
                    <i className="ri-close-line"></i>
                </button>
            </div>

            {/* Quick Objection Badges */}
            <div style={{
                padding: '0.625rem 0.875rem',
                background: 'var(--bg-hover)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                gap: '0.35rem',
                flexWrap: 'wrap'
            }}>
                {QUICK_OBJECTIONS.map((obj, i) => (
                    <button
                        key={i}
                        onClick={() => handleAskCopilot(obj)}
                        disabled={loading}
                        style={{
                            background: 'var(--bg-card)',
                            border: '1px solid var(--border)',
                            borderRadius: '999px',
                            padding: '0.2rem 0.5rem',
                            fontSize: '0.7rem',
                            cursor: 'pointer',
                            color: 'var(--text-main)',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {obj}
                    </button>
                ))}
            </div>

            {/* Active Response Display */}
            <div ref={resultRef} style={{
                padding: '1rem',
                flex: 1,
                overflowY: 'auto',
                fontSize: '0.85rem',
                lineHeight: '1.5'
            }}>
                {loading ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '2rem 0', color: 'var(--text-secondary)' }}>
                        <i className="ri-loader-4-line spin" style={{ fontSize: '20px', color: '#4F46E5' }}></i>
                        <span>Generating objection strategy...</span>
                    </div>
                ) : advice ? (
                    <div style={{
                        background: 'rgba(79, 70, 229, 0.05)',
                        border: '1px solid rgba(79, 70, 229, 0.2)',
                        borderRadius: '0.75rem',
                        padding: '0.875rem',
                        position: 'relative'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4F46E5' }}>🎯 Gemini 2.5 Copilot Advice</span>
                            <button
                                onClick={() => handleCopy(advice)}
                                style={{
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#4F46E5',
                                    cursor: 'pointer',
                                    fontSize: '0.75rem',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem'
                                }}
                            >
                                <i className="ri-file-copy-line"></i> Copy
                            </button>
                        </div>
                        <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-main)' }}>
                            {advice}
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem 1rem' }}>
                        <i className="ri-chat-voice-line" style={{ fontSize: '32px', color: '#9CA3AF', display: 'block', marginBottom: '0.5rem' }}></i>
                        <p style={{ margin: 0, fontSize: '0.8125rem' }}>
                            Type a prospect objection or click a quick tag above to get instant high-conversion talking points.
                        </p>
                    </div>
                )}

                {/* History */}
                {history.length > 1 && (
                    <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Previous Advice</span>
                        {history.slice(1).map((item, idx) => (
                            <div key={idx} style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'var(--bg-hover)', borderRadius: '0.5rem', fontSize: '0.75rem' }}>
                                <div style={{ fontWeight: 600, color: 'var(--primary)' }}>Q: {item.q}</div>
                                <div style={{ color: 'var(--text-secondary)', marginTop: '0.25rem', whiteSpace: 'pre-line' }}>{item.a}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Input Bar */}
            <div style={{
                padding: '0.75rem',
                borderTop: '1px solid var(--border)',
                background: 'var(--bg-card)',
                display: 'flex',
                gap: '0.5rem'
            }}>
                <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleAskCopilot(); }}
                    placeholder="Prospect: 'Can you call back next week?'"
                    style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--border)',
                        background: 'var(--input-bg)',
                        color: 'var(--text-main)',
                        fontSize: '0.8125rem',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={() => handleAskCopilot()}
                    disabled={loading || !query.trim()}
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem' }}
                >
                    <i className="ri-send-plane-fill"></i>
                </button>
            </div>
        </div>
    );
};

export default CopilotDrawer;
