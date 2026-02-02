import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layout/DashboardLayout';
import Settings from './pages/Settings';
import Leads from './pages/Leads';
import Pipeline from './pages/Pipeline';
import CallLogs from './pages/CallLogs';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import PasswordReset from './pages/PasswordReset';
import LinkVerification from './pages/LinkVerification';
import AuthCallback from './pages/AuthCallback';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Activity from './pages/Activity';
import Help from './pages/Help';
import { Toaster } from 'react-hot-toast';
import { AppearanceProvider } from './context/AppearanceContext';
import './index.css';

function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  useEffect(() => {
    // If user is already in localStorage, try to refresh their data
    const syncUser = async () => {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      if (storedUser && (storedUser.id || storedUser._id)) {
        try {
          // We can use getUsers and filter for now, or add a getProfile endpoint
          // Let's assume getUsers is efficient enough for now or add getProfile to api.js
          const response = await fetch(`http://localhost:8000/api/users/${storedUser.id || storedUser._id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } // Add auth header if needed for getById
          });
          if (response.ok) {
            const latestUser = await response.json();
            const userData = {
              id: latestUser._id,
              name: latestUser.name,
              email: latestUser.email,
              role: latestUser.role,
              permissions: latestUser.permissions || [],
              status: latestUser.status,
              lastLogin: latestUser.lastLogin,
              avatar: latestUser.avatar,
              avatarHistory: latestUser.avatarHistory,
              googleId: latestUser.googleId,
              facebookId: latestUser.facebookId,
              microsoftId: latestUser.microsoftId,
              googleAvatar: latestUser.googleAvatar,
              facebookAvatar: latestUser.facebookAvatar,
              microsoftAvatar: latestUser.microsoftAvatar,
              isCustomAvatar: latestUser.isCustomAvatar,
              hasPassword: latestUser.hasPassword !== undefined ? latestUser.hasPassword : !!latestUser.password
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          console.error('Failed to sync user data:', error);
        }
      }
    };
    syncUser();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  const handleUserUpdate = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

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
          <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />} />
          <Route path="/password-reset" element={<PasswordReset />} />
          <Route path="/auth/callback" element={<AuthCallback onLogin={handleLogin} />} />
          <Route path="/auth/verify-link" element={<LinkVerification onLogin={handleLogin} />} />

          <Route path="/" element={user ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="leads" element={<Leads />} />
            <Route path="pipeline" element={<Pipeline />} />
            <Route path="call-logs" element={<CallLogs />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="activity" element={<Activity />} />
            <Route path="profile" element={<Profile user={user} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />} />
            <Route path="settings" element={<Settings />} />
            <Route path="help" element={<Help />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Router>
    </AppearanceProvider>
  );
}

export default App;
