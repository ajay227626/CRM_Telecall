import React, { useState, useEffect } from 'react';
import { Shield, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiUrl';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 1. Read auth_error from URL if redirected back from a failed callback
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const authErr = params.get('auth_error') || params.get('error');
      if (authErr) {
        setError(decodeURIComponent(authErr));
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('auth_error');
        cleanUrl.searchParams.delete('error');
        cleanUrl.searchParams.delete('error_description');
        window.history.replaceState({}, document.title, cleanUrl.pathname + (cleanUrl.search ? cleanUrl.search : ''));
      }
    } catch (_) {}
  }, []);

  // 2. Sanitize return URL
  const getCleanReturnUrl = () => {
    try {
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('returnUrl') || '/';
      // Ensure local relative path only (prevent open redirects)
      return returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
    } catch {
      return '/';
    }
  };

  // 3. Initiate OIDC Login
  const handleLogin = () => {
    if (loading) return;
    setLoading(true);
    setError('');
    const returnUrl = encodeURIComponent(getCleanReturnUrl());
    const apiUrl = getApiBaseUrl();
    window.location.href = `${apiUrl}/api/auth/oidc/login?returnUrl=${returnUrl}`;
  };

  return (
    <div className="login-container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="login-card" style={{ maxWidth: '420px', width: '100%', borderRadius: '16px', padding: '32px', background: '#1e293b', color: '#fff', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#3b82f6', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
            <Shield size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0' }}>Sign In to Telecall CRM</h2>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>Secured by Central SLM Ecosystem Identity</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', padding: '12px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
            <p style={{ margin: 0, fontSize: '13px', color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '10px',
            border: 'none',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
              <span>Redirecting to SLM...</span>
            </>
          ) : (
            <>
              <span>Continue with SLM</span>
              <ArrowRight size={16} />
            </>
          )}
        </button>

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #334155', textAlign: 'center' }}>
          <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>
            Unified Enterprise SSO • End-to-End Cryptographic Handshake
          </p>
        </div>
      </div>
    </div>
  );
}
