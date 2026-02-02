import React, { useEffect, useState } from 'react';
import { useCall } from '../../context/CallContext';
import { playDtmfTone } from '../../utils/audioUtils';

const CallingScreen = () => {
    const {
        callStatus,
        activeNumber,
        callDuration,
        formatDuration,
        endCall,
        isMutedInput,
        toggleMuteInput,
        isMutedOutput,
        toggleMuteOutput,
        isRecording,
        toggleRecording,
        setMinimized,
        recordingDuration,
        getMaskedNumber
    } = useCall();

    const [showKeypad, setShowKeypad] = useState(false);
    const [keypadInput, setKeypadInput] = useState('');

    const handleKeypadClick = (key) => {
        playDtmfTone(key);
        setKeypadInput(prev => prev + key);
    };

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

    return (
        <div className="calling-screen flex flex-col h-full bg-slate-900 text-white overflow-hidden">
            {/* Minimize Button */}
            <div className="absolute top-3 right-3 z-10">
                <button
                    onClick={() => setMinimized(true)}
                    className="text-white/60 hover:text-white p-1"
                >
                    <i className="ri-arrow-down-s-line text-xl"></i>
                </button>
            </div>

            {/* Call Info - Compact */}
            <div className={`flex flex-col items-center justify-center py-4 transition-all ${showKeypad ? 'opacity-50 scale-90' : ''}`}>
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg mb-2"
                    style={{ background: 'var(--primary)' }}
                >
                    <i className="ri-user-line text-white"></i>
                </div>

                <h3 className="text-lg font-bold mb-0.5">{getMaskedNumber(activeNumber)}</h3>

                <p className="text-sm font-medium tracking-wide flex items-center gap-2" style={{ color: 'var(--primary)' }}>
                    {callStatus === 'ringing' && (
                        <>
                            <span className="animate-spin"><i className="ri-loader-4-line"></i></span>
                            Ringing...
                        </>
                    )}
                    {callStatus === 'incall' && (
                        <span className="text-green-400">{formatDuration(callDuration)}</span>
                    )}
                    {callStatus === 'ending' && (
                        <span className="text-red-400">Call Ended</span>
                    )}
                </p>

                {showKeypad && keypadInput && (
                    <div className="text-xl font-mono mt-1">{keypadInput}</div>
                )}
            </div>

            {/* Waveform - Smaller */}
            {callStatus === 'incall' && !showKeypad && (
                <div className="h-6 flex items-center justify-center gap-1 opacity-40 mb-2">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-0.5 bg-white rounded-full animate-sound-wave"
                            style={{ height: `${20 + Math.random() * 80}%`, animationDelay: `${i * 0.1}s` }}
                        />
                    ))}
                </div>
            )}

            {/* In-Call Keypad Overlay */}
            {showKeypad && (
                <div className="flex-1 flex flex-col items-center justify-center bg-slate-900/95 backdrop-blur z-20 px-4">
                    <div className="grid grid-cols-3 gap-3">
                        {keys.map((key) => (
                            <button
                                key={key}
                                onClick={() => handleKeypadClick(key)}
                                className="w-12 h-12 rounded-full bg-slate-700 hover:bg-slate-600 flex items-center justify-center text-lg font-bold transition-colors"
                            >
                                {key}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => setShowKeypad(false)} className="mt-3 text-xs text-gray-400 hover:text-white">
                        Hide Keypad
                    </button>
                </div>
            )}

            {/* Controls - Compact Grid */}
            <div className="controls-container bg-slate-800/80 backdrop-blur-md p-4 rounded-t-2xl border-t border-white/10 mt-auto">
                <div className="grid grid-cols-3 gap-4 mb-4">
                    {/* Mute */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={toggleMuteInput}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isMutedInput ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                        >
                            <i className={`text-lg ${isMutedInput ? 'ri-mic-off-line' : 'ri-mic-line'}`}></i>
                        </button>
                        <span className="text-[9px] text-slate-400">Mute</span>
                    </div>

                    {/* Keypad */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={() => setShowKeypad(!showKeypad)}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${showKeypad ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                        >
                            <i className="ri-grid-fill text-lg"></i>
                        </button>
                        <span className="text-[9px] text-slate-400">Keypad</span>
                    </div>

                    {/* Speaker */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={toggleMuteOutput}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isMutedOutput ? 'bg-white text-slate-900' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                        >
                            <i className={`text-lg ${isMutedOutput ? 'ri-volume-mute-line' : 'ri-volume-up-line'}`}></i>
                        </button>
                        <span className="text-[9px] text-slate-400">Speaker</span>
                    </div>

                    {/* Record */}
                    <div className="flex flex-col items-center gap-1">
                        <button
                            onClick={toggleRecording}
                            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all ${isRecording ? 'bg-red-500/20 text-red-500 border border-red-500' : 'bg-slate-700/50 text-white hover:bg-slate-700'}`}
                        >
                            <i className="ri-record-circle-line text-lg"></i>
                        </button>
                        <div className="flex flex-col items-center">
                            <span className={`text-[9px] ${isRecording ? 'text-red-400' : 'text-slate-400'}`}>Rec</span>
                            {isRecording && <span className="text-[8px] text-red-400 font-mono">{formatDuration(recordingDuration)}</span>}
                        </div>
                    </div>

                    {/* Hold */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="w-11 h-11 rounded-full bg-slate-700/50 text-white hover:bg-slate-700 flex items-center justify-center transition-all">
                            <i className="ri-pause-line text-lg"></i>
                        </button>
                        <span className="text-[9px] text-slate-400">Hold</span>
                    </div>

                    {/* Add */}
                    <div className="flex flex-col items-center gap-1">
                        <button className="w-11 h-11 rounded-full bg-slate-700/50 text-white hover:bg-slate-700 flex items-center justify-center transition-all">
                            <i className="ri-user-add-line text-lg"></i>
                        </button>
                        <span className="text-[9px] text-slate-400">Add</span>
                    </div>
                </div>


                {/* Hangup Button - Enhanced */}
                <div className="flex justify-center pt-2">
                    <button
                        onClick={endCall}
                        className="transition-transform hover:scale-105 active:scale-95"
                        style={{
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            background: '#ef4444',
                            border: 'none',
                            boxShadow: '0 8px 24px rgba(239, 68, 68, 0.4), 0 0 0 4px rgba(239, 68, 68, 0.1)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            position: 'relative',
                            zIndex: 10
                        }}
                        title="End Call"
                    >
                        <i className="ri-phone-fill" style={{
                            fontSize: '28px',
                            color: 'white',
                            transform: 'rotate(135deg)'
                        }}></i>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CallingScreen;
