import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';

const MarkdownViewer = ({ filePath, onBack }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMarkdown = async () => {
            try {
                setLoading(true);
                const response = await fetch(filePath);
                if (!response.ok) {
                    throw new Error(`Failed to load guide: ${response.statusText}`);
                }
                const text = await response.text();
                setContent(text);
                setError(null);
            } catch (err) {
                console.error('Error loading markdown:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchMarkdown();
    }, [filePath]);

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4rem',
                color: 'var(--text-secondary)'
            }}>
                <i className="ri-loader-4-line" style={{
                    fontSize: '48px',
                    animation: 'spin 1s linear infinite',
                    marginBottom: '1rem',
                    color: 'var(--primary)'
                }}></i>
                <p style={{ fontSize: '1.125rem' }}>Loading guide...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div style={{
                padding: '2rem',
                background: 'rgba(255, 59, 48, 0.1)',
                borderRadius: '0.75rem',
                border: '1px solid rgba(255, 59, 48, 0.3)'
            }}>
                <h2 style={{ color: '#ff3b30', marginBottom: '0.5rem' }}>
                    <i className="ri-error-warning-line" style={{ marginRight: '0.5rem' }}></i>
                    Failed to Load Guide
                </h2>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>{error}</p>
                <button
                    onClick={onBack}
                    style={{
                        marginTop: '1rem',
                        padding: '0.625rem 1.25rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        fontWeight: '600'
                    }}
                >
                    <i className="ri-arrow-left-line" style={{ marginRight: '0.5rem' }}></i>
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div style={{ position: 'relative' }}>
            {/* Back Button */}
            <div style={{
                position: 'sticky',
                top: 0,
                background: 'var(--bg-main)',
                padding: '1.5rem 0',
                marginBottom: '1rem',
                zIndex: 100,
                borderBottom: '1px solid var(--border)',
                backdropFilter: 'blur(10px)',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <button
                    onClick={onBack}
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.625rem 1.25rem',
                        background: 'var(--bg-card)',
                        color: 'var(--text-main)',
                        border: '1px solid var(--border)',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontSize: '0.9375rem',
                        fontWeight: '600',
                        transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--bg-hover)';
                        e.currentTarget.style.transform = 'translateX(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-card)';
                        e.currentTarget.style.transform = 'translateX(0)';
                    }}
                >
                    <i className="ri-arrow-left-line"></i>
                    Back to Help Center
                </button>
            </div>

            {/* Markdown Content */}
            <div className="markdown-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw, rehypeSanitize]}
                >
                    {content}
                </ReactMarkdown>
            </div>

            {/* Inline CSS for markdown styling */}
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }

                .markdown-content {
                    line-height: 1.7;
                    color: var(--text-main);
                }

                .markdown-content h1 {
                    font-size: 2.25rem;
                    font-weight: 700;
                    margin: 2rem 0 1.5rem 0;
                    color: var(--text-main);
                    border-bottom: 2px solid var(--border);
                    padding-bottom: 0.75rem;
                }

                .markdown-content h2 {
                    font-size: 1.875rem;
                    font-weight: 700;
                    margin: 2rem 0 1rem 0;
                    color: var(--text-main);
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }

                .markdown-content h3 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin: 1.5rem 0 0.75rem 0;
                    color: var(--primary);
                }

                .markdown-content h4 {
                    font-size: 1.25rem;
                    font-weight: 600;
                    margin: 1.25rem 0 0.5rem 0;
                    color: var(--text-main);
                }

                .markdown-content p {
                    margin: 1rem 0;
                    color: var(--text-secondary);
                    font-size: 1rem;
                }

                .markdown-content ul, .markdown-content ol {
                    margin: 1rem 0;
                    padding-left: 2rem;
                    color: var(--text-secondary);
                }

                .markdown-content li {
                    margin: 0.5rem 0;
                    line-height: 1.7;
                }

                .markdown-content a {
                    color: var(--primary);
                    text-decoration: none;
                    border-bottom: 1px solid transparent;
                    transition: border-color 0.2s;
                }

                .markdown-content a:hover {
                    border-bottom-color: var(--primary);
                }

                .markdown-content code {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    padding: 0.2rem 0.4rem;
                    border-radius: 0.25rem;
                    font-family: 'Monaco', 'Menlo', 'Courier New', monospace;
                    font-size: 0.875rem;
                    color: var(--primary);
                }

                .markdown-content pre {
                    background: var(--bg-card);
                    border: 1px solid var(--border);
                    border-radius: 0.5rem;
                    padding: 1.25rem;
                    overflow-x: auto;
                    margin: 1.5rem 0;
                }

                .markdown-content pre code {
                    background: none;
                    border: none;
                    padding: 0;
                    font-size: 0.9rem;
                    color: var(--text-main);
                }

                .markdown-content blockquote {
                    margin: 1.5rem 0;
                    padding: 1rem 1.5rem;
                    background: linear-gradient(135deg, var(--primary-light), rgba(var(--primary-rgb), 0.05));
                    border-left: 4px solid var(--primary);
                    border-radius: 0 0.5rem 0.5rem 0;
                    color: var(--text-main);
                    font-style: italic;
                }

                .markdown-content blockquote p {
                    margin: 0.5rem 0;
                    color: var(--text-main);
                }

                .markdown-content blockquote strong {
                    color: var(--primary);
                    font-weight: 700;
                }

                .markdown-content table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 1.5rem 0;
                    background: var(--bg-card);
                    border-radius: 0.5rem;
                    overflow: hidden;
                }

                .markdown-content th {
                    background: var(--primary);
                    color: white;
                    padding: 0.875rem 1rem;
                    text-align: left;
                    font-weight: 600;
                }

                .markdown-content td {
                    padding: 0.875rem 1rem;
                    border-top: 1px solid var(--border);
                    color: var(--text-secondary);
                }

                .markdown-content tr:hover {
                    background: var(--bg-hover);
                }

                .markdown-content hr {
                    border: none;
                    border-top: 2px dashed var(--border);
                    margin: 2.5rem 0;
                }

                .markdown-content strong {
                    color: var(--text-main);
                    font-weight: 700;
                }

                .markdown-content em {
                    color: var(--text-main);
                    font-style: italic;
                }

                .markdown-content img {
                    max-width: 100%;
                    height: auto;
                    border-radius: 0.5rem;
                    margin: 1.5rem 0;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }

                /* Alert boxes (rendered from blockquotes with specific patterns) */
                .markdown-content blockquote:has(strong:first-child) {
                    background: var(--bg-card);
                    border-left-width: 4px;
                }

                /* Code block language labels */
                .markdown-content pre[class*="language-"] {
                    position: relative;
                }

                /* Responsive adjustments */
                @media (max-width: 768px) {
                    .markdown-content h1 { font-size: 1.75rem; }
                    .markdown-content h2 { font-size: 1.5rem; }
                    .markdown-content h3 { font-size: 1.25rem; }
                    .markdown-content h4 { font-size: 1.125rem; }
                    
                    .markdown-content table {
                        font-size: 0.875rem;
                    }
                    
                    .markdown-content pre {
                        font-size: 0.8125rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default MarkdownViewer;
