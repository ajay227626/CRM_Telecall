import React, { useState, useRef, useEffect } from 'react';
import { useCall } from '../../context/CallContext';
import Dialer from './Dialer';
import CallingScreen from './CallingScreen';
import PiPContainer from './PiPContainer';

const DialerWidget = () => {
    const { isDialerOpen, toggleDialer, callStatus, minimized, setMinimized, pipWindow, togglePiP, startCall, endCall, activeNumber } = useCall();
    const [position, setPosition] = useState({ x: window.innerWidth - 350, y: window.innerHeight - 550 });
    const [size, setSize] = useState({ width: 260, height: 560 });
    const isDragging = useRef(false);
    const dragOffset = useRef({ x: 0, y: 0 });
    const widgetRef = useRef(null);

    // If call is active/ringing, always show widget unless minimized explicitly
    const isCallActive = callStatus !== 'idle';
    const showWidget = isDialerOpen || isCallActive;

    // Handle Global Key Shortcuts for calling
    useEffect(() => {
        const handleGlobalKeyDown = (e) => {
            // Only if widget is open
            if (!showWidget) return;

            // Command/Ctrl + Enter -> Call
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                if (callStatus === 'idle' && activeNumber) {
                    startCall(activeNumber);
                }
            }

            // Command/Ctrl + Esc -> End Call
            if ((e.metaKey || e.ctrlKey) && e.key === 'Escape') {
                if (isCallActive) {
                    endCall();
                }
            }
        };

        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, [showWidget, callStatus, isCallActive, activeNumber, startCall, endCall]);


    // Handle Dragging
    const handleMouseDown = (e) => {
        // Only drag if clicking the header/handle, AND NOT a button
        if (e.target.closest('.drag-handle') && !e.target.closest('button')) {
            isDragging.current = true;
            const rect = widgetRef.current.getBoundingClientRect();
            dragOffset.current = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging.current) {
            let newX = e.clientX - dragOffset.current.x;
            let newY = e.clientY - dragOffset.current.y;

            // Boundaries
            const maxX = window.innerWidth - size.width;
            const maxY = window.innerHeight - size.height;

            newX = Math.max(0, Math.min(newX, maxX));
            newY = Math.max(0, Math.min(newY, maxY));

            setPosition({ x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        isDragging.current = false;
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
    };

    // If PiP is active, render content there
    if (pipWindow) {
        return (
            <>
                <PiPContainer>
                    <div className="flex flex-col h-full bg-slate-900 text-white">
                        {/* Header for PiP */}
                        <div className="p-2 bg-slate-800 flex justify-between items-center border-b border-slate-700">
                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-2">External Call</h3>
                            <button onClick={togglePiP} className="text-gray-400 hover:text-white p-1" title="Restore to Tab">
                                <i className="ri-logout-box-r-line"></i>
                            </button>
                        </div>
                        <div className="flex-1 overflow-auto">
                            {callStatus === 'idle' ? <Dialer /> : <CallingScreen />}
                        </div>
                    </div>
                </PiPContainer>

                {/* Placeholder in main window */}
                {showWidget && !minimized && (
                    <div
                        className="fixed bottom-6 right-6 bg-slate-800/50 backdrop-blur-sm p-4 rounded-xl border border-slate-700/50 flex flex-col items-center gap-2 text-white shadow-lg animate-pulse"
                    >
                        <i className="ri-external-link-line text-2xl"></i>
                        <span className="text-xs">Popped out active</span>
                        <button onClick={togglePiP} className="text-xs text-blue-400 hover:text-blue-300 underline">Restore</button>
                    </div>
                )}
            </>
        );
    }

    // When idle and not explicitly opened, don't render anything (button will be in CallLogs header)
    if (!showWidget || (minimized && !isCallActive)) {
        return null;
    }

    // Minimized Active Call State (Pill)
    if (minimized && isCallActive) {
        return (
            <div
                onClick={() => setMinimized(false)}
                className="fixed bottom-6 right-6 bg-slate-900 text-white rounded-full shadow-lg p-2 pr-6 flex items-center gap-3 cursor-pointer z-50 hover:bg-slate-800 transition-all border border-slate-700"
            >
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center animate-pulse">
                    <i className="ri-phone-fill text-xl"></i>
                </div>
                <div className="flex flex-col">
                    <span className="text-xs font-bold text-green-400 uppercase tracking-wider">{callStatus === 'incall' ? 'In Call' : 'Calling...'}</span>
                    <span className="text-xs text-gray-300">Click to expand</span>
                </div>
            </div>
        );
    }

    // Expanded Widget State (Draggable)
    return (
        <div
            ref={widgetRef}
            className="fixed rounded-2xl shadow-2xl z-50 transition-shadow overflow-hidden flex flex-col"
            style={{
                left: position.x,
                top: position.y,
                width: size.width,
                height: isCallActive ? 480 : 500,
                maxWidth: 380,
                minWidth: 250,
                maxHeight: 600,
                minHeight: 380,
                background: 'var(--bg-card)'
            }}
            onMouseDown={handleMouseDown}
        >
            {/* Drag Handle & Header */}
            <div
                className="drag-handle p-2 cursor-move flex justify-between items-center select-none border-b"
                style={{ background: 'var(--bg-hover)', borderColor: 'var(--border)' }}
            >
                <div className="flex items-center gap-2 px-2">
                    <i className="ri-drag-move-2-line" style={{ color: 'var(--text-secondary)' }}></i>
                    <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Tele-Dialer</span>
                </div>
                <div className="flex items-center gap-1">
                    <button onClick={togglePiP} className="p-1 rounded" style={{ color: 'var(--text-secondary)' }} title="Pop Out (PiP)">
                        <i className="ri-external-link-line"></i>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); setMinimized(true); }} className="p-1 rounded" style={{ color: 'var(--text-secondary)' }} title="Minimize">
                        <i className="ri-subtract-line"></i>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden" style={{ background: 'var(--bg-main)' }}>
                {callStatus === 'idle' ? (
                    <Dialer />
                ) : (
                    <CallingScreen />
                )}
            </div>
        </div>
    );
};

export default DialerWidget;
