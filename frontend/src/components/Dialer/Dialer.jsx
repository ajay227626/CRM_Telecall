import React from 'react';
import { useCall } from '../../context/CallContext';
import { playDtmfTone } from '../../utils/audioUtils';

const Dialer = () => {
    const {
        activeNumber,
        setActiveNumber,
        callType,
        setCallType,
        startCall,
        closeDialer
    } = useCall();

    const handleNumberClick = (num) => {
        playDtmfTone(num);
        setActiveNumber((prev) => prev + num);
    };

    const handleBackspace = () => {
        setActiveNumber((prev) => prev.slice(0, -1));
    };

    const handleCall = () => {
        if (activeNumber) {
            startCall(activeNumber);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleCall();
        }
    };

    const keys = [
        { label: '1', sub: '' },
        { label: '2', sub: 'ABC' },
        { label: '3', sub: 'DEF' },
        { label: '4', sub: 'GHI' },
        { label: '5', sub: 'JKL' },
        { label: '6', sub: 'MNO' },
        { label: '7', sub: 'PQRS' },
        { label: '8', sub: 'TUV' },
        { label: '9', sub: 'WXYZ' },
        { label: '*', sub: '' },
        { label: '0', sub: '+' },
        { label: '#', sub: '' },
    ];

    return (
        <div className="dialer-view h-full flex flex-col" style={{ background: 'var(--bg-card)', color: 'var(--text-main)' }}>
            <div className="dialer-header flex justify-between items-center p-3 border-b hidden" style={{ borderColor: 'var(--border)' }}>
                <h3 className="text-base font-bold">Keypad</h3>
                <button onClick={closeDialer} className="p-1 rounded hover:opacity-70">
                    <i className="ri-close-line text-xl"></i>
                </button>
            </div>

            <div className="dialer-display p-4 flex flex-col items-center gap-2">
                <input
                    type="text"
                    value={activeNumber}
                    onChange={(e) => setActiveNumber(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Enter number"
                    className="w-full text-center text-2xl font-bold bg-slate-800 text-white rounded-xl py-3 border-none focus:ring-2 outline-none placeholder:text-gray-400"
                    style={{ focusRingColor: 'var(--primary)' }}
                />
                <div className="call-type-selector flex justify-center">
                    <div className="flex rounded-lg p-1" style={{ background: 'var(--bg-hover)' }}>
                        <button
                            onClick={() => setCallType('Masked')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all`}
                            style={{
                                background: callType === 'Masked' ? 'var(--bg-card)' : 'transparent',
                                color: callType === 'Masked' ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: callType === 'Masked' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Masked
                        </button>
                        <button
                            onClick={() => setCallType('Normal')}
                            className={`px-4 py-1.5 text-xs font-medium rounded-md transition-all`}
                            style={{
                                background: callType === 'Normal' ? 'var(--bg-card)' : 'transparent',
                                color: callType === 'Normal' ? 'var(--primary)' : 'var(--text-secondary)',
                                boxShadow: callType === 'Normal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                            }}
                        >
                            Normal
                        </button>
                    </div>
                </div>
            </div>

            <div className="dialer-keypad grid grid-cols-3 gap-2 px-6 flex-1 place-content-center">
                {keys.map((key) => (
                    <button
                        key={key.label}
                        onClick={() => handleNumberClick(key.label)}
                        className="keypad-btn flex flex-col items-center w-14 h-12 rounded transition-colors mx-auto text-2xl font-medium"
                        style={{ color: 'var(--text-main)' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <span>{key.label}</span>
                        {key.sub && <span className="text-[9px] font-normal" style={{ color: 'var(--text-secondary)', lineHeight: '1rem' }}>{key.sub}</span>}
                    </button>
                ))}
            </div>

            <div className="dialer-actions flex justify-center items-center gap-6 py-4">
                <div className="w-10"></div>

                <button
                    onClick={handleCall}
                    disabled={!activeNumber}
                    className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95`}
                    style={{
                        background: !activeNumber ? 'var(--bg-hover)' : 'var(--primary)',
                        cursor: !activeNumber ? 'not-allowed' : 'pointer',
                        color: !activeNumber ? 'var(--text-secondary)' : 'white'
                    }}
                >
                    <i className="ri-phone-fill text-2xl"></i>
                </button>

                <button
                    onClick={handleBackspace}
                    className="w-10 h-10 flex items-center justify-center rounded-full"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                    <i className="ri-delete-back-2-line text-xl"></i>
                </button>
            </div>
        </div>
    );
};

export default Dialer;
