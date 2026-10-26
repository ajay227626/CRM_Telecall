import React, { useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { analyzeCallWithAi } from '../../utils/api';
import notify from '../../utils/toast';

const CallDetailsModal = ({ call: initialCall, onClose, onUpdate }) => {
    useEscapeKey(onClose);
    const [call, setCall] = useState(initialCall);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    if (!call) return null;

    const handleRunAiAnalysis = async () => {
        setIsAnalyzing(true);
        try {
            const res = await analyzeCallWithAi({
                callId: call._id,
                leadId: call.leadId,
                notes: call.notes,
                transcript: call.transcription,
                audioUrl: call.recordingUrl
            });

            if (res.success && res.analysis) {
                notify.success('AI Analysis generated successfully!');
                const updated = {
                    ...call,
                    aiAnalysis: res.analysis,
                    aiSummary: res.analysis.summary,
                    aiScore: Math.round(((res.analysis.sentimentScore || 0) + 1) * 5),
                    disposition: res.analysis.recommendedDisposition
                };
                setCall(updated);
                if (onUpdate) onUpdate(updated);
            }
        } catch (err) {
            console.error('Failed to run AI analysis:', err);
            notify.error(err.message || 'AI Analysis failed');
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatDuration = (seconds) => {
        if (!seconds) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getStatusBadge = (status) => {
        const colors = {
            'initiated': { bg: '#DBEAFE', text: '#1E40AF' },
            'completed': { bg: '#D1FAE5', text: '#047857' },
            'no answer': { bg: '#FEE2E2', text: '#DC2626' }
        };
        const color = colors[status] || { bg: '#F3F4F6', text: '#374151' };
        return (
            <span style={{
                backgroundColor: color.bg,
                color: color.text,
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: 500
            }}>
                {status}
            </span>
        );
    };

    const getScoreColor = (score) => {
        if (score >= 7) return '#047857';
        if (score >= 5) return '#F59E0B';
        return '#DC2626';
    };

    const ai = call.aiAnalysis;

    return (
        <div className="modal-overlay">
            <div className="modal call-details-modal" style={{ width: '680px', maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <i className="ri-phone-line" style={{ fontSize: '22px', color: 'var(--primary)' }}></i>
                        <div>
                            <h3 style={{ margin: 0 }}>Call Details</h3>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>ID: {call._id}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="modal-close"><i className="ri-close-line" style={{ fontSize: '20px' }}></i></button>
                </div>

                <div className="modal-body">
                    {/* Call Information Row */}
                    <div className="details-grid" style={{ marginBottom: '1.25rem' }}>
                        <div className="details-section">
                            <h4 className="section-title">Call Information</h4>
                            <div className="info-rows">
                                <div className="info-row">
                                    <span className="info-label">Lead:</span>
                                    <span className="info-value font-semibold">{call.leadName}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Caller:</span>
                                    <span className="info-value">{call.caller}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Duration:</span>
                                    <span className="info-value">{formatDuration(call.duration)}</span>
                                </div>
                                <div className="info-row">
                                    <span className="info-label">Status:</span>
                                    {getStatusBadge(call.status)}
                                </div>
                            </div>
                        </div>

                        {/* AI Quality & Trigger Box */}
                        <div className="details-section ai-section" style={{ background: 'var(--bg-hover)', borderRadius: '0.75rem', padding: '1rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                <h4 className="section-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                    <i className="ri-sparkling-fill" style={{ color: '#F59E0B' }}></i> Gemini AI
                                </h4>
                                <button
                                    onClick={handleRunAiAnalysis}
                                    disabled={isAnalyzing}
                                    className="btn btn-primary"
                                    style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.35rem' }}
                                >
                                    {isAnalyzing ? (
                                        <><i className="ri-loader-4-line spin"></i> Analyzing...</>
                                    ) : (
                                        <><i className="ri-sparkling-line"></i> {ai ? 'Re-Analyze' : 'Analyze Call'}</>
                                    )}
                                </button>
                            </div>

                            <div className="ai-score-display" style={{ marginTop: '0.5rem' }}>
                                <span className="score-label">Quality Score:</span>
                                <span
                                    className="score-value font-bold"
                                    style={{ color: call.aiScore ? getScoreColor(call.aiScore) : '#6B7280' }}
                                >
                                    {call.aiScore ? `${call.aiScore}/10` : 'Not Scored'}
                                </span>
                            </div>
                            {call.aiScore ? (
                                <div className="score-bar" style={{ marginTop: '0.35rem' }}>
                                    <div
                                        className="score-fill"
                                        style={{
                                            width: `${Math.min(100, (call.aiScore / 10) * 100)}%`,
                                            backgroundColor: getScoreColor(call.aiScore),
                                            height: '6px',
                                            borderRadius: '999px'
                                        }}
                                    />
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Rich AI Intelligence Insights if Available */}
                    {ai && (
                        <div className="card-section" style={{
                            border: '1px solid var(--border)',
                            borderRadius: '0.75rem',
                            padding: '1.25rem',
                            marginBottom: '1.25rem',
                            background: 'rgba(245, 158, 11, 0.03)'
                        }}>
                            <h4 className="section-title" style={{ color: '#D97706', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <i className="ri-brain-line"></i> AI Intelligence & Dispositions
                            </h4>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginTop: '0.75rem' }}>
                                <div style={{ background: 'var(--bg-card)', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Sentiment</span>
                                    <span style={{ fontWeight: 600, textTransform: 'capitalize', color: ai.customerSentiment === 'positive' ? '#059669' : ai.customerSentiment === 'negative' ? '#DC2626' : '#6B7280' }}>
                                        {ai.customerSentiment || 'Neutral'} ({((ai.sentimentScore || 0) * 100).toFixed(0)}%)
                                    </span>
                                </div>

                                <div style={{ background: 'var(--bg-card)', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Lead Intent</span>
                                    <span style={{ fontWeight: 600, textTransform: 'capitalize', color: ai.leadIntent === 'high' ? '#2563EB' : 'var(--text-main)' }}>
                                        {ai.leadIntent || 'Medium'}
                                    </span>
                                </div>

                                <div style={{ background: 'var(--bg-card)', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Suggested Disposition</span>
                                    <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        {ai.recommendedDisposition || 'Interested - Follow-up'}
                                    </span>
                                </div>

                                {ai.budgetMentionedINR ? (
                                    <div style={{ background: 'var(--bg-card)', padding: '0.625rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                        <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'block' }}>Budget Mentioned</span>
                                        <span style={{ fontWeight: 600, color: '#059669' }}>
                                            ₹{ai.budgetMentionedINR.toLocaleString('en-IN')}
                                        </span>
                                    </div>
                                ) : null}
                            </div>

                            {/* Detected Objections */}
                            {ai.detectedObjections && ai.detectedObjections.length > 0 && (
                                <div style={{ marginTop: '0.875rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Detected Objections:</span>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                                        {ai.detectedObjections.map((obj, i) => (
                                            <span key={i} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem' }}>
                                                {obj}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Action Items */}
                            {ai.actionItems && ai.actionItems.length > 0 && (
                                <div style={{ marginTop: '0.875rem' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Next Action Items:</span>
                                    <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0, fontSize: '0.8125rem' }}>
                                        {ai.actionItems.map((item, i) => (
                                            <li key={i}>{item}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Coaching Tip */}
                            {ai.telecallerCoachingTip && (
                                <div style={{
                                    marginTop: '0.875rem',
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    borderLeft: '3px solid #3B82F6',
                                    padding: '0.5rem 0.75rem',
                                    borderRadius: '0 0.375rem 0.375rem 0',
                                    fontSize: '0.8125rem',
                                    color: '#1E40AF'
                                }}>
                                    <strong>💡 Agent Coaching Tip:</strong> {ai.telecallerCoachingTip}
                                </div>
                            )}
                        </div>
                    )}

                    {/* AI Summary */}
                    {call.aiSummary && (
                        <div className="card-section" style={{ marginBottom: '1.25rem' }}>
                            <h4 className="section-title">AI Summary</h4>
                            <p className="summary-text" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>{call.aiSummary}</p>
                        </div>
                    )}

                    {/* Recording Player */}
                    {call.recordingUrl && (
                        <div className="card-section" style={{ marginBottom: '1.25rem' }}>
                            <h4 className="section-title">Call Recording</h4>
                            <div className="recording-controls">
                                <button
                                    className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => setIsPlaying(!isPlaying)}
                                >
                                    {isPlaying ? <><i className="ri-pause-line"></i> Pause</> : <><i className="ri-play-line"></i> Play Recording</>}
                                </button>
                                <a
                                    href={call.recordingUrl}
                                    download
                                    target="_blank"
                                    rel="noreferrer"
                                    className="btn btn-secondary"
                                    style={{ textDecoration: 'none' }}
                                >
                                    <i className="ri-download-line"></i> Download
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Transcription */}
                    {call.transcription && (
                        <div className="card-section" style={{ marginBottom: '1.25rem' }}>
                            <h4 className="section-title">Call Transcription</h4>
                            <p className="transcription-text" style={{ fontSize: '0.8125rem', background: 'var(--bg-card)', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--border)' }}>
                                {call.transcription}
                            </p>
                        </div>
                    )}

                    {/* Agent Notes */}
                    <div className="card-section">
                        <h4 className="section-title">Telecaller Notes</h4>
                        <p className="notes-text" style={{ fontSize: '0.875rem', color: call.notes ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                            {call.notes || 'No notes added for this call.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallDetailsModal;
