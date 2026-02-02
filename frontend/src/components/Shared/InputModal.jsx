import React, { useState, useEffect } from 'react';

const InputModal = ({
    isOpen,
    onClose,
    onSubmit,
    title,
    message,
    initialValue = '',
    placeholder = '',
    type = 'text' // text, email, etc.
}) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (value.trim()) {
            onSubmit(value.trim());
            setValue('');
        }
    };

    return (
        <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="rounded-xl shadow-2xl w-full max-w-md p-6"
                style={{ background: 'var(--bg-card)' }}
                onClick={e => e.stopPropagation()}
            >
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <h3
                            className="text-xl font-semibold mb-2"
                            style={{ color: 'var(--text-main)' }}
                        >
                            {title}
                        </h3>
                        {message && (
                            <p
                                className="text-sm"
                                style={{ color: 'var(--text-secondary)' }}
                            >
                                {message}
                            </p>
                        )}
                    </div>

                    <input
                        type={type}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        autoFocus
                        className="w-full px-3 py-2.5 rounded-lg border focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all outline-none mb-6"
                        style={{
                            borderColor: 'var(--border)',
                            backgroundColor: 'var(--bg-main)',
                            color: 'var(--text-main)'
                        }}
                    />

                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border font-medium transition-colors"
                            style={{
                                borderColor: 'var(--border)',
                                color: 'var(--text-secondary)'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors shadow-sm"
                        >
                            Submit
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InputModal;
