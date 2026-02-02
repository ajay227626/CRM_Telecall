import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const CallContext = createContext();

export const useCall = () => {
    const context = useContext(CallContext);
    if (!context) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};

export const CallProvider = ({ children }) => {
    // UI State
    const [isDialerOpen, setIsDialerOpen] = useState(false);
    const [minimized, setMinimized] = useState(true); // Start minimized

    // Call State
    const [callStatus, setCallStatus] = useState('idle'); // idle, dialing, ringing, incall, ending, ended
    const [activeNumber, setActiveNumber] = useState('');
    const [callType, setCallType] = useState('Masked'); // Masked, Normal
    const [callDuration, setCallDuration] = useState(0);

    // Lead Info (for proper logging)
    const [leadInfo, setLeadInfo] = useState(null); // { id, name, phone }

    // Call Controls
    const [isMutedInput, setIsMutedInput] = useState(false); // Microphone
    const [isMutedOutput, setIsMutedOutput] = useState(false); // Speaker
    const [isRecording, setIsRecording] = useState(false);

    // Timer Ref
    const timerRef = useRef(null);

    const toggleDialer = () => {
        setIsDialerOpen(!isDialerOpen);
        if (!isDialerOpen) {
            setMinimized(false);
        }
    };

    const closeDialer = () => {
        if (callStatus === 'idle') {
            setIsDialerOpen(false);
            setMinimized(true);
        } else {
            setMinimized(true);
        }
    };

    // Helper function to initiate a call from external components (Leads, MakeCallModal, etc.)
    const initiateCallWithLead = (lead, selectedCallType = 'Masked') => {
        if (!lead || !lead.phone) return;

        // Store lead info for proper logging
        setLeadInfo({
            id: lead._id || lead.id,
            name: lead.name,
            phone: lead.phone
        });

        // Set call type
        setCallType(selectedCallType);

        // Open the dialer and ensure it's not minimized
        setIsDialerOpen(true);
        setMinimized(false);

        // Set the number and start the call
        setActiveNumber(lead.phone);
        startCall(lead.phone);
    };

    const startCall = (number) => {
        if (!number) return;
        setActiveNumber(number);
        setCallStatus('dialing');
        setCallDuration(0);

        // Simulate connection flow
        setTimeout(() => {
            setCallStatus('ringing');
            setTimeout(() => {
                setCallStatus('incall');
                startTimer();
            }, 2000);
        }, 1500);
    };

    const endCall = async () => {
        stopTimer();
        setCallStatus('ending');

        // Log the call
        if (activeNumber) {
            try {
                // Determine status based on duration
                const status = callDuration > 0 ? 'completed' : 'no answer';

                await fetch('http://localhost:8000/api/call-logs', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        // Add Authorization if needed (presuming public or verified by cookie/header elsewhere?) 
                        // Usually requires token. I'll check how api.js does it.
                        // For now, I'll try to use the `initiateCall` or just fetch.
                        // BETTER: Import `createCallLog` from api.js if it exists, or use raw fetch with localStorage token.
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    },
                    body: JSON.stringify({
                        leadId: leadInfo?.id || null,
                        leadName: leadInfo?.name || 'Unknown Lead',
                        leadPhone: activeNumber,
                        caller: JSON.parse(localStorage.getItem('user') || '{}')?.name || 'Agent',
                        duration: callDuration,
                        status: status,
                        callType: callType === 'Normal' ? 'Direct' : callType,
                        maskedNumber: callType === 'Masked' ? getMaskedNumber(activeNumber) : null
                    })
                });
            } catch (error) {
                console.error("Failed to log call", error);
            }
        }

        setTimeout(() => {
            setCallStatus('idle');
            setCallDuration(0);
            setIsMutedInput(false);
            setIsMutedOutput(false);
            setIsRecording(false);
            setLeadInfo(null); // Clear lead info after call ends
        }, 1000);
    };

    const startTimer = () => {
        stopTimer();
        timerRef.current = setInterval(() => {
            setCallDuration((prev) => prev + 1);
        }, 1000);
    };

    const stopTimer = () => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
    };

    const formatDuration = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const toggleMuteInput = () => setIsMutedInput(!isMutedInput);
    const toggleMuteOutput = () => setIsMutedOutput(!isMutedOutput);
    const toggleRecording = () => setIsRecording(!isRecording);

    // Auto-clean timer on unmount
    useEffect(() => {
        return () => stopTimer();
    }, []);

    // PiP State
    const [pipWindow, setPipWindow] = useState(null);

    const togglePiP = async () => {
        if (pipWindow) {
            pipWindow.close();
            setPipWindow(null);
            return;
        }

        // Check if API is supported
        if (!('documentPictureInPicture' in window)) {
            alert('Picture-in-Picture API is not supported in this browser.');
            return;
        }

        try {
            const pip = await window.documentPictureInPicture.requestWindow({
                width: 320,
                height: 500,
            });

            // Copy styles
            const styleSheets = Array.from(document.styleSheets);
            styleSheets.forEach((styleSheet) => {
                try {
                    if (styleSheet.href) {
                        const link = document.createElement('link');
                        link.rel = 'stylesheet';
                        link.href = styleSheet.href;
                        pip.document.head.appendChild(link);
                    } else if (styleSheet.cssRules) {
                        const style = document.createElement('style');
                        Array.from(styleSheet.cssRules).forEach((rule) => {
                            style.appendChild(document.createTextNode(rule.cssText));
                        });
                        pip.document.head.appendChild(style);
                    }
                } catch (e) {
                    // Ignore CORS or access errors for cross-origin sheets
                    console.warn('Could not copy stylesheet', e);
                }
            });

            // Handle PiP close (e.g. via X button)
            pip.addEventListener('pagehide', () => {
                setPipWindow(null);
            });

            setPipWindow(pip);
        } catch (error) {
            console.error('Failed to open PiP window:', error);
        }
    };

    // Recording Timer
    const [recordingDuration, setRecordingDuration] = useState(0);
    const recordingTimerRef = useRef(null);

    useEffect(() => {
        if (isRecording) {
            setRecordingDuration(0);
            recordingTimerRef.current = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
        } else {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
                recordingTimerRef.current = null;
            }
        }
        return () => {
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        };
    }, [isRecording]);

    // Masking Helper
    const getMaskedNumber = (number) => {
        if (!number || callType !== 'Masked') return number;
        if (number.length < 4) return '***';
        const visibleStart = Math.min(2, number.length - 2);
        const visibleEnd = 2;
        const start = number.substring(0, visibleStart);
        const end = number.substring(number.length - visibleEnd);
        const middle = '*'.repeat(Math.max(0, number.length - visibleStart - visibleEnd));
        return `${start}${middle}${end}`;
    };

    const value = {
        isDialerOpen,
        minimized,
        setMinimized,
        toggleDialer,
        closeDialer,
        callStatus,
        activeNumber,
        setActiveNumber,
        callType,
        setCallType,
        startCall,
        endCall,
        callDuration,
        formatDuration,
        isMutedInput,
        toggleMuteInput,
        isMutedOutput,
        toggleMuteOutput,
        isRecording,
        toggleRecording,
        recordingDuration,
        getMaskedNumber,
        pipWindow,
        togglePiP,
        // New exports for external call initiation
        initiateCallWithLead,
        leadInfo
    };

    return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};
