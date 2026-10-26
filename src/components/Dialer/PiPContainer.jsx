import React from 'react';
import { createPortal } from 'react-dom';
import { useCall } from '../../context/CallContext';

const PiPContainer = ({ children }) => {
    const { pipWindow } = useCall();

    if (pipWindow) {
        return createPortal(
            <div className="h-full w-full bg-slate-900 text-white">
                {children}
            </div>,
            pipWindow.document.body
        );
    }

    return null;
};

export default PiPContainer;
