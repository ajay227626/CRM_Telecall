import React, { useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';

const CallDetailsModal = ({ call, onClose }) => {
    useEscapeKey(onClose);
    if (!call) return null;
    const [isPlaying, setIsPlaying] = useState(false);

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
        if (score >= 8) return '#047857';
        if (score >= 6) return '#F59E0B';
        return '#DC2626';
    };

    return (
        <div className="modal-overlay">
            <div className="modal call-details-modal" style={{ width: '600px' }}>
                <div className="modal-header">
                    <h3>Call Details</h3>
                    <button onClick={onClose} className="modal-close"><i className="ri-close-line" style={{ fontSize: '20px' }}></i></button>
                </div>

                <div className="modal-body">
                    {/* Call Info & AI Analysis */}
                    <div className="details-grid">
                        <div className="details-section">
                            <h4 className="section-title">Call Information</h4>
                            <div className="info-rows">
                                <div className="info-row">
                                    <span className="info-label">Lead:</span>
                                    <span className="info-value">{call.leadName}</span>
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

                        <div className="details-section ai-section">
                            <h4 className="section-title">AI Analysis</h4>
                            <div className="ai-score-display">
                                <span className="score-label">Quality Score:</span>
                                <span
                                    className="score-value"
                                    style={{ color: call.aiScore ? getScoreColor(call.aiScore) : '#6B7280' }}
                                >
                                    {call.aiScore ? `${call.aiScore}/10` : 'N/A'}
                                </span>
                            </div>
                            {call.aiScore && (
                                <div className="score-bar">
                                    <div
                                        className="score-fill"
                                        style={{
                                            width: `${(call.aiScore / 10) * 100}%`,
                                            backgroundColor: getScoreColor(call.aiScore)
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recording */}
                    {call.recordingUrl && (
                        <div className="card-section">
                            <h4 className="section-title">Call Recording</h4>
                            <div className="recording-controls">
                                <button
                                    className={`btn ${isPlaying ? 'btn-secondary' : 'btn-primary'}`}
                                    onClick={() => setIsPlaying(!isPlaying)}
                                >
                                    {isPlaying ? <><i className="ri-pause-line" style={{ fontSize: '16px' }}></i> Pause</> : <><i className="ri-play-line" style={{ fontSize: '16px' }}></i> Play Recording</>}
                                </button>
                                <button className="btn btn-secondary">
                                    <i className="ri-download-line" style={{ fontSize: '16px' }}></i> Download
                                </button>
                            </div>
                        </div>
                    )}

                    {/* AI Summary */}
                    {call.aiSummary && (
                        <div className="card-section">
                            <h4 className="section-title">AI Summary</h4>
                            <p className="summary-text">{call.aiSummary}</p>
                        </div>
                    )}

                    {/* Transcription */}
                    {call.transcription && (
                        <div className="card-section">
                            <h4 className="section-title">Call Transcription</h4>
                            <p className="transcription-text">{call.transcription}</p>
                        </div>
                    )}

                    {/* Notes */}
                    <div className="card-section">
                        <h4 className="section-title">Notes</h4>
                        <p className="notes-text">{call.notes || 'No notes added.'}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CallDetailsModal;
