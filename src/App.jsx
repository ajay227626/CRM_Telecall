import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import Settings from './pages/Settings';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import CallLogs from './pages/CallLogs';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import LandingPage from './pages/LandingPage';
import AuthCallback from './pages/AuthCallback';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import Help from './pages/Help';
import { Toaster } from 'react-hot-toast';
import { AppearanceProvider } from './context/AppearanceContext';
import { getApiBaseUrl } from './utils/apiUrl';
import './index.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Session check and reactive tab focus listener
  useEffect(() => {
    let lastCheckTime = 0;
    const DEBOUNCE_MS = 10000; // Check at most once every 10 seconds on focus

    const verifySessionHealth = async (isInitial = false) => {
      const now = Date.now();
      if (!isInitial && now - lastCheckTime < DEBOUNCE_MS) {
        return;
      }
      lastCheckTime = now;

      try {
        const apiUrl = getApiBaseUrl();
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          credentials: 'include'
        });

        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
            localStorage.setItem('user', JSON.stringify(data.user));
          } else {
            handleSessionRevoked();
          }
        } else if (res.status === 401) {
          handleSessionRevoked();
        }
      } catch (err) {
        console.error('Session liveness check error:', err);
        if (isInitial) {
          const cached = localStorage.getItem('user');
          if (cached) {
            try { setUser(JSON.parse(cached)); } catch (_) {}
          }
        }
      } finally {
        if (isInitial) setLoading(false);
      }
    };

    const handleSessionRevoked = () => {
      setUser((prevUser) => {
        if (prevUser) {
          localStorage.clear();
          window.location.href = '/login?auth_error=' + encodeURIComponent('Your session was revoked or expired centrally. Please sign in again.');
        }
        return null;
      });
      localStorage.removeItem('user');
    };

    // Initial check
    verifySessionHealth(true);

    // Tab focus and visibilitychange listeners
    const onFocus = () => verifySessionHealth(false);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        verifySessionHealth(false);
      }
    };

    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibilityChange);

    // Periodic 3-minute heartbeat while active
    const heartbeat = setInterval(() => {
      verifySessionHealth(false);
    }, 3 * 60 * 1000);

    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(heartbeat);
    };
  }, []);

  // 2. Automatic Ecosystem Launch Listener (?sso=slm)
  useEffect(() => {
    if (loading) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('sso') === 'slm' && !params.get('auth_error')) {
      const orgId = params.get('organisation_id') || params.get('organisationId') || '';
      const prompt = params.get('prompt') || '';

      if (!user) {
        const apiUrl = getApiBaseUrl();
        let url = `${apiUrl}/api/auth/oidc/login?returnUrl=${encodeURIComponent(window.location.pathname)}`;
        if (orgId) url += `&organisation_id=${encodeURIComponent(orgId)}`;
        if (prompt) url += `&prompt=${encodeURIComponent(prompt)}`;
        window.location.href = url;
      }
    }
  }, [user, loading]);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = async () => {
    try {
      const apiUrl = getApiBaseUrl();
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
    localStorage.clear();
    setUser(null);
    window.location.href = 'https://ajaywebservices.in/login';
  };

  const handleUserUpdate = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main, #0f172a)' }}>
        <i className="ri-loader-4-line spin" style={{ fontSize: '2.5rem', color: '#3b82f6' }} />
      </div>
    );
  }

  return (
    <AppearanceProvider>
      <Toaster position="top-right" toastOptions={{
        style: {
          background: 'var(--bg-card)',
          color: 'var(--text-main)',
          border: '1px solid var(--border)'
        }
      }} />
      <Router>
        <Routes>
          {/* Public Landing & Authentication */}
          <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <LandingPage user={user} />} />
          <Route path="/landing" element={<LandingPage user={user} />} />
          <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />

          {/* Authenticated Workspace */}
          <Route element={user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="call-logs" element={<CallLogs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="activity" element={<Activity />} />
            <Route path="profile" element={<Profile user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Router>
    </AppearanceProvider>
  );
}

export default App;
