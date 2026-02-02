import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, toggleUserStatus, updateUserPermissions, updateUser, uploadAvatar, selectAvatar, deactivateAccount, requestDeleteAccount, confirmDeleteAccount, getEffectiveSettings, createUser, deleteUser } from '../utils/api';
import { hasPermission, PERMISSIONS, getUser } from '../utils/permissions';
import ConfirmationModal from '../components/Shared/ConfirmationModal';
import { useAppearance } from '../context/AppearanceContext';

// Helper to format date/time according to user settings
const formatDateTime = (dateValue, settings = {}) => {
    if (!dateValue) return 'N/A';

    const date = new Date(dateValue);
    const { dateFormat = 'DD/MM/YYYY', timeFormat = '24h' } = settings;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    let formattedDate;
    switch (dateFormat) {
        case 'MM/DD/YYYY':
            formattedDate = `${month}/${day}/${year}`;
            break;
        case 'YYYY-MM-DD':
            formattedDate = `${year}-${month}-${day}`;
            break;
        case 'DD/MM/YYYY':
        default:
            formattedDate = `${day}/${month}/${year}`;
    }

    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    let formattedTime;
    if (timeFormat === '12h') {
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    } else {
        formattedTime = `${String(hours).padStart(2, '0')}:${minutes}:${seconds}`;
    }

    return `${formattedDate}, ${formattedTime}`;
};
// Helper to get a stable Facebook Avatar URL
const getFacebookAvatarUrl = (user) => {
    // 1. If we have the ID directly, use the Graph API
    if (user.facebookId) {
        return `https://graph.facebook.com/${user.facebookId}/picture?width=1024&v=${new Date().getTime()}`;
    }
    // 2. If not, try to extract ASID from the stored URL (platform-lookaside...)
    if (user.facebookAvatar && user.facebookAvatar.includes('asid=')) {
        const match = user.facebookAvatar.match(/asid=([0-9]+)/);
        if (match && match[1]) {
            return `https://graph.facebook.com/${match[1]}/picture?width=1024`;
        }
    }
    // 3. Fallback to the stored URL
    return user.facebookAvatar;
};

const SecuritySettings = ({ user, navigate, onUserUpdate }) => {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [passwordStep, setPasswordStep] = useState('initial'); // 'initial' (change), 'set-new', 'otp'
    const [step, setStep] = useState('initial'); // initial, suggestion, otp, confirm
    const [otp, setOtp] = useState('');
    const [confirmText, setConfirmText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState('');

    // Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Security Verification Modal State (for link/unlink and sensitive actions)
    const [showSecurityModal, setShowSecurityModal] = useState(false);
    const [securityAction, setSecurityAction] = useState(null); // { type: 'link'|'unlink'|'deactivate', provider?: string }
    const [securityMethod, setSecurityMethod] = useState('password'); // 'password' or 'otp'
    const [securityOtp, setSecurityOtp] = useState('');
    const [securityPassword, setSecurityPassword] = useState('');
    const [securityStep, setSecurityStep] = useState('choose'); // 'choose', 'verify', 'otp-sent'
    const [securityLoading, setSecurityLoading] = useState(false);
    const [securityError, setSecurityError] = useState(null);

    // Close modals on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setShowDeleteModal(false);
                setShowPasswordModal(false);
                setShowSecurityModal(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // Handle modal overlay click (click outside)
    const handleOverlayClick = (e, closeHandler) => {
        if (e.target === e.currentTarget) {
            closeHandler();
        }
    };

    const handleDeactivate = () => {
        // Show security verification modal instead of simple confirm
        setSecurityAction({ type: 'deactivate' });
        setSecurityStep('choose');
        setSecurityMethod('password');
        setSecurityPassword('');
        setSecurityOtp('');
        setSecurityError(null);
        setShowSecurityModal(true);
    };

    const startDeleteProcess = () => {
        setStep('suggestion');
        setShowDeleteModal(true);
    };

    const handleRequestOtp = async () => {
        setLoading(true);
        setError(null);
        try {
            await requestDeleteAccount();
            setStep('otp');
        } catch (err) {
            setError('Failed to send verification code');
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        setLoading(true);
        setError(null);
        try {
            await confirmDeleteAccount(otp, confirmText);
            localStorage.clear();
            navigate('/login');
            window.location.reload();
        } catch (err) {
            setError(err.message || 'Failed to delete account');
            setLoading(false);
        }
    };

    // Linking logic
    const handleLinkProvider = (provider) => {
        // Redirect to backend auth route with 'link' indication (implemented as basic login flow but session persists)
        // Ideally we would have specific /connect routes, but reused login routes work if session is active.
        // However, standard OAuth login might redirect to dashboard.
        // For MVP, we use the same routes. The backend will detect user is logged in (if we were using session cookies correctly),
        // or we simply re-authenticate.
        // BETTER: Use spec-compliant endpoint if possible. For now, we assume simple redirection works.
        // WARNING: If this logs a new user in, it might clear current session if not handled.
        // which will merge if backend supports it (our current implementation doesn't merge automatically).
        // which will merge if backend supports it (our current implementation doesn't merge automatically).
        // Let's stick to 'unlink' being the main functional part here as requested to 'bind' is complex without backend merging logic.
        // But user asked to "bind". 
        // We will execute a simple redirect to the provider auth.
        const url = `http://localhost:8000/api/auth/${provider}`;
        window.location.href = url;
    };

    const handleUnlinkProvider = (provider) => {
        // Show security verification modal
        setSecurityAction({ type: 'unlink', provider });
        setSecurityStep('choose');
        setSecurityMethod('password');
        setSecurityPassword('');
        setSecurityOtp('');
        setSecurityError(null);
        setShowSecurityModal(true);
    };

    // Security verification handlers
    const handleSecurityRequestOtp = async () => {
        setSecurityLoading(true);
        setSecurityError(null);
        try {
            const api = await import('../utils/api');
            await api.requestSecurityOTP();
            setSecurityStep('otp-sent');
        } catch (err) {
            setSecurityError(err.message || 'Failed to send OTP');
        } finally {
            setSecurityLoading(false);
        }
    };

    const handleSecurityVerify = async () => {
        setSecurityLoading(true);
        setSecurityError(null);
        try {
            const api = await import('../utils/api');

            // Verify credentials first
            const credential = securityMethod === 'password' ? { password: securityPassword } : { otp: securityOtp };
            await api.verifySecurityAction(credential);

            // Execute the action
            if (securityAction.type === 'unlink') {
                await api.unlinkProvider(securityAction.provider);
                alert(`${securityAction.provider} account unlinked successfully`);
                setShowSecurityModal(false);
                window.location.reload();
            } else if (securityAction.type === 'link') {
                setShowSecurityModal(false);
                const url = `http://localhost:8000/api/auth/${securityAction.provider}`;
                window.location.href = url;
            } else if (securityAction.type === 'deactivate') {
                await deactivateAccount();
                localStorage.clear();
                navigate('/login');
                window.location.reload();
            }
        } catch (err) {
            setSecurityError(err.message || 'Verification failed');
        } finally {
            setSecurityLoading(false);
        }
    };

    // Password Management
    const startPasswordProcess = () => {
        setShowPasswordModal(true);
        setError(null);
        setSuccessMsg('');
        setOtp('');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');

        if (!user.hasPassword) {
            setPasswordStep('set-new'); // User has no password, go straight to setting one
        } else {
            setPasswordStep('initial'); // User has password, needs to enter current one first
        }
    };

    const handlePasswordAction = async () => {
        setError(null);
        setLoading(true);

        try {
            const api = await import('../utils/api');

            if (passwordStep === 'set-new') {
                // Request OTP for setting password
                await api.requestSetPasswordOTP();
                setPasswordStep('otp-set');
                setSuccessMsg('Verification code sent to email.');
            } else if (passwordStep === 'initial') {
                // Validate current password and request OTP for change
                await api.initiateChangePassword(currentPassword, newPassword);
                setPasswordStep('otp-change');
                setSuccessMsg('Current password verified. Code sent to email.');
            } else if (passwordStep === 'otp-set') {
                // Verify OTP and Set Password
                await api.verifyAndSetPassword(otp, newPassword);
                alert('Password set successfully!');
                setShowPasswordModal(false);
                window.location.reload();
            } else if (passwordStep === 'otp-change') {
                // Verify OTP and Change Password
                await api.finalizeChangePassword(otp, newPassword);
                alert('Password changed successfully!');
                setShowPasswordModal(false);
                window.location.reload();
            }
        } catch (err) {
            setError(err.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="security-pane card">
            <h3>Security Settings</h3>
            <p className="text-secondary mb-6">Manage your account security and authentication.</p>

            {/* Account Linking Section */}
            <div className="account-actions-section mb-6">
                <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--text-main)' }}>Connected Accounts</h4>
                <div className="flex flex-col gap-3">
                    {/* Google */}
                    <div className="flex items-center justify-between p-3 border rounded-lg" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="18" alt="Google" />
                            </div>
                            <div>
                                <span className="font-medium block" style={{ color: 'var(--text-main)' }}>Google</span>
                                <span className="text-xs text-gray-500">{user.googleId ? 'Linked' : 'Not linked'}</span>
                            </div>
                        </div>
                        {user.googleId ? (
                            <button className="btn btn-sm btn-disconnect" onClick={() => handleUnlinkProvider('google')}>
                                <i className="ri-link-unlink-m"></i> Disconnect
                            </button>
                        ) : (
                            <button className="btn btn-sm btn-connect" onClick={() => handleLinkProvider('google')}>
                                <i className="ri-link-m"></i> Connect
                            </button>
                        )}
                    </div>
                    {/* Microsoft */}
                    <div className="flex items-center justify-between p-3 border rounded-lg" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 23 23">
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-medium block" style={{ color: 'var(--text-main)' }}>Microsoft</span>
                                <span className="text-xs text-gray-500">{user.microsoftId ? 'Linked' : 'Not linked'}</span>
                            </div>
                        </div>
                        {user.microsoftId ? (
                            <button className="btn btn-sm btn-disconnect" onClick={() => handleUnlinkProvider('microsoft')}>
                                <i className="ri-link-unlink-m"></i> Disconnect
                            </button>
                        ) : (
                            <button className="btn btn-sm btn-connect" onClick={() => handleLinkProvider('microsoft')}>
                                <i className="ri-link-m"></i> Connect
                            </button>
                        )}
                    </div>
                    {/* Facebook */}
                    <div className="flex items-center justify-between p-3 border rounded-lg" style={{ background: 'var(--bg-card)' }}>
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
                                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </div>
                            <div>
                                <span className="font-medium block" style={{ color: 'var(--text-main)' }}>Facebook</span>
                                <span className="text-xs text-gray-500">{user.facebookId ? 'Linked' : 'Not linked'}</span>
                            </div>
                        </div>
                        {user.facebookId ? (
                            <button className="btn btn-sm btn-disconnect" onClick={() => handleUnlinkProvider('facebook')}>
                                <i className="ri-link-unlink-m"></i> Disconnect
                            </button>
                        ) : (
                            <button className="btn btn-sm btn-connect" onClick={() => handleLinkProvider('facebook')}>
                                <i className="ri-link-m"></i> Connect
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Password Management */}
            <div className="account-actions-section mb-6">
                <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--text-main)' }}>Password & Authentication</h4>
                <div className="action-card p-4 border rounded-lg flex justify-between items-center" style={{ background: 'var(--bg-main)' }}>
                    <div>
                        <h5 className="font-medium" style={{ color: 'var(--text-main)' }}>
                            {user.hasPassword ? 'Change Password' : 'Set Password'}
                        </h5>
                        <p className="text-sm text-gray-500">
                            {user.hasPassword
                                ? 'Update your password securely with OTP verification.'
                                : 'Secure your account by setting a password.'}
                        </p>
                    </div>
                    <button
                        className="btn btn-secondary"
                        onClick={startPasswordProcess}
                    >
                        {user.hasPassword ? 'Change Password' : 'Set Password'}
                    </button>
                </div>
            </div>

            {/* Account Actions (Deactivate/Delete) */}
            <div className="account-actions-section">
                <h4 className="text-lg font-medium mb-4" style={{ color: 'var(--text-main)' }}>Danger Zone</h4>

                <div className="action-card p-4 border rounded-lg mb-4 flex justify-between items-center" style={{ background: 'var(--bg-main)' }}>
                    <div>
                        <h5 className="font-medium" style={{ color: 'var(--text-main)' }}>Deactivate Account</h5>
                        <p className="text-sm text-gray-500">Temporarily disable your account. You can reactivate it later.</p>
                    </div>
                    <button
                        className="btn btn-warning"
                        onClick={handleDeactivate}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : 'Deactivate'}
                    </button>
                </div>

                <div className="action-card p-4 border rounded-lg border-red-200 bg-red-50 flex justify-between items-center">
                    <div>
                        <h5 className="font-medium text-red-900">Delete Account</h5>
                        <p className="text-sm text-red-700">Permanently remove your account and all data. This cannot be undone.</p>
                    </div>
                    <button
                        className="btn btn-danger"
                        onClick={startDeleteProcess}
                        disabled={loading}
                    >
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Security Verification Modal */}
            {showSecurityModal && (
                <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowSecurityModal(false))}>
                    <div className="modal-content card" style={{ maxWidth: '480px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>
                                {securityAction?.type === 'unlink' && `Disconnect ${securityAction.provider.charAt(0).toUpperCase() + securityAction.provider.slice(1)}`}
                                {securityAction?.type === 'link' && `Connect ${securityAction.provider.charAt(0).toUpperCase() + securityAction.provider.slice(1)}`}
                                {securityAction?.type === 'deactivate' && 'Deactivate Account'}
                            </h3>
                            <button className="close-btn" onClick={() => setShowSecurityModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {securityError && <div className="alert alert-danger mb-4">{securityError}</div>}

                            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
                                For your security, please verify your identity before proceeding.
                            </p>

                            {/* Step: Choose Verification Method */}
                            {securityStep === 'choose' && (
                                <>
                                    <div className="flex flex-col gap-3 mb-4">
                                        <label
                                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                                            style={{
                                                border: securityMethod === 'password' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: securityMethod === 'password' ? 'var(--primary-light)' : 'var(--bg-card)'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="securityMethod"
                                                value="password"
                                                checked={securityMethod === 'password'}
                                                onChange={() => setSecurityMethod('password')}
                                                className="w-4 h-4 border border-gray-300 focus:ring-2 focus:ring-primary"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium block">Verify with Password</span>
                                                <span className="text-xs text-gray-500">Use your account password</span>
                                            </div>
                                        </label>
                                        <label
                                            className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                                            style={{
                                                border: securityMethod === 'otp' ? '2px solid var(--primary)' : '1px solid var(--border)',
                                                background: securityMethod === 'otp' ? 'var(--primary-light)' : 'var(--bg-card)'
                                            }}
                                        >
                                            <input
                                                type="radio"
                                                name="securityMethod"
                                                value="otp"
                                                checked={securityMethod === 'otp'}
                                                onChange={() => setSecurityMethod('otp')}
                                                className="w-4 h-4 border border-gray-300 focus:ring-2 focus:ring-primary"
                                            />
                                            <div className="flex flex-col">
                                                <span className="font-medium block">Verify with OTP</span>
                                                <span className="text-xs text-gray-500">Send a code to your email</span>
                                            </div>
                                        </label>
                                    </div>

                                    {securityMethod === 'password' && (
                                        <div className="form-group mb-4">
                                            <label>Enter Password</label>
                                            <input
                                                type="password"
                                                className="form-input"
                                                placeholder="Your password"
                                                value={securityPassword}
                                                onChange={(e) => setSecurityPassword(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            className="btn btn-secondary flex-1"
                                            onClick={() => setShowSecurityModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        {securityMethod === 'password' ? (
                                            <button
                                                className="btn btn-primary flex-1"
                                                onClick={handleSecurityVerify}
                                                disabled={!securityPassword || securityLoading}
                                            >
                                                {securityLoading ? 'Verifying...' : 'Verify'}
                                            </button>
                                        ) : (
                                            <button
                                                className="btn btn-primary flex-1"
                                                onClick={handleSecurityRequestOtp}
                                                disabled={securityLoading}
                                            >
                                                {securityLoading ? 'Sending...' : 'Send OTP'}
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}

                            {/* Step: Enter OTP */}
                            {securityStep === 'otp-sent' && (
                                <>
                                    <div className="p-3 bg-green-100 text-green-700 rounded mb-4 text-sm">
                                        Verification code sent to <strong>{user.email}</strong>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label>Enter 6-digit Code</label>
                                        <input
                                            type="text"
                                            className="form-input text-center text-xl tracking-widest"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={securityOtp}
                                            onChange={(e) => setSecurityOtp(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>
                                    <div className="flex gap-3">
                                        <button
                                            className="btn btn-secondary flex-1"
                                            onClick={() => setSecurityStep('choose')}
                                        >
                                            Back
                                        </button>
                                        <button
                                            className="btn btn-primary flex-1"
                                            onClick={handleSecurityVerify}
                                            disabled={securityOtp.length !== 6 || securityLoading}
                                        >
                                            {securityLoading ? 'Verifying...' : 'Verify'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Password Modal */}
            {showPasswordModal && (
                <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowPasswordModal(false))}>
                    <div className="modal-content card" style={{ maxWidth: '480px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>{user.hasPassword ? 'Change Password' : 'Set Password'}</h3>
                            <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
                        </div>
                        <div className="modal-body">
                            {error && <div className="alert alert-danger mb-4">{error}</div>}
                            {successMsg && <div className="p-3 bg-green-100 text-green-700 rounded mb-4 text-sm">{successMsg}</div>}

                            {/* Step: Enter Current Password (if changing) */}
                            {passwordStep === 'initial' && (
                                <>
                                    <div className="form-group mb-3">
                                        <label>Current Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-3">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label>Confirm New Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={handlePasswordAction}
                                        disabled={!currentPassword || !newPassword || newPassword !== confirmPassword || loading}
                                    >
                                        {loading ? 'Verifying...' : 'Verify'}
                                    </button>
                                </>
                            )}

                            {/* Step: Set New Password (if none exists) */}
                            {passwordStep === 'set-new' && (
                                <>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Enter a strong password. We will send a code to your email to confirm.
                                    </p>
                                    <div className="form-group mb-3">
                                        <label>New Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                    </div>
                                    <div className="form-group mb-4">
                                        <label>Confirm Password</label>
                                        <input
                                            type="password"
                                            className="form-input"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={handlePasswordAction}
                                        disabled={!newPassword || newPassword !== confirmPassword || loading}
                                    >
                                        {loading ? 'Sending Code...' : 'Send Verification Code'}
                                    </button>
                                </>
                            )}

                            {/* Step: Verify OTP (Shared for both flows) */}
                            {(passwordStep === 'otp-set' || passwordStep === 'otp-change') && (
                                <>
                                    <p className="mb-4 text-sm text-gray-600">
                                        Enter the code sent to <strong>{user.email}</strong> to confirm.
                                    </p>
                                    <div className="form-group mb-4">
                                        <label>Verification Code</label>
                                        <input
                                            type="text"
                                            className="form-input text-center text-xl tracking-widest"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={handlePasswordAction}
                                        disabled={otp.length !== 6 || loading}
                                    >
                                        {loading ? 'Processing...' : 'Confirm & Save Password'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowDeleteModal(false))}>
                    <div className="modal-content card" style={{ maxWidth: '500px', width: '90%' }}>
                        <div className="modal-header">
                            <h3 className="text-red-600">
                                {step === 'suggestion' && 'Wait! Considering Deactivation?'}
                                {step === 'otp' && 'Verify Identity'}
                                {step === 'confirm' && 'Final Confirmation'}
                            </h3>
                            <button className="close-btn" onClick={() => setShowDeleteModal(false)}>×</button>
                        </div>

                        <div className="modal-body">
                            {error && <div className="alert alert-danger mb-4">{error}</div>}

                            {step === 'suggestion' && (
                                <div className="text-center">
                                    <div className="mb-4">
                                        <i className="ri-error-warning-fill text-yellow-500 text-4xl"></i>
                                    </div>
                                    <p className="mb-4 text-gray-700">
                                        Deleting your account is permanent and cannot be undone.
                                        Would you prefer to <strong>Deactivate</strong> instead?
                                    </p>
                                    <p className="text-sm text-gray-500 mb-6">
                                        Deactivating hides your profile but keeps your data safe if you decide to return.
                                    </p>
                                    <div className="flex flex-col gap-3">
                                        <button
                                            className="btn btn-warning w-full"
                                            onClick={() => {
                                                setShowDeleteModal(false);
                                                handleDeactivate();
                                            }}
                                        >
                                            Deactivate Instead (Recommended)
                                        </button>
                                        <button
                                            className="btn btn-secondary w-full text-red-600 hover:bg-red-50"
                                            onClick={() => handleRequestOtp()}
                                            disabled={loading}
                                        >
                                            {loading ? 'Sending OTP...' : 'No, I want to delete my account'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'otp' && (
                                <div>
                                    <p className="mb-4 text-sm text-gray-600">
                                        For security, we've sent a verification code to <strong>{user.email}</strong>.
                                    </p>
                                    <div className="form-group mb-4">
                                        <label>Verification Code</label>
                                        <input
                                            type="text"
                                            className="form-input text-center text-xl tracking-widest"
                                            placeholder="000000"
                                            maxLength={6}
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-primary w-full"
                                        onClick={() => setStep('confirm')}
                                        disabled={otp.length !== 6}
                                    >
                                        Verify Code
                                    </button>
                                    <div className="text-center mt-3">
                                        <button
                                            className="text-primary text-sm underline"
                                            onClick={handleRequestOtp}
                                            disabled={loading}
                                        >
                                            Resend Code
                                        </button>
                                    </div>
                                </div>
                            )}

                            {step === 'confirm' && (
                                <div>
                                    <div className="bg-red-50 border border-red-200 p-3 rounded mb-4">
                                        <p className="text-red-800 text-sm font-bold">
                                            <i className="ri-alert-fill mr-1"></i> FINAL WARNING
                                        </p>
                                        <p className="text-red-700 text-xs mt-1">
                                            This action is irreversible. All your leads, calls, and data will be permanently deleted.
                                        </p>
                                    </div>
                                    <div className="form-group mb-4">
                                        <label className="text-sm">Type <strong>i_want_delete_my_account</strong> to confirm</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            placeholder="i_want_delete_my_account"
                                            value={confirmText}
                                            onChange={(e) => setConfirmText(e.target.value)}
                                            onPaste={(e) => e.preventDefault()} // Force typing
                                        />
                                    </div>
                                    <button
                                        className="btn btn-danger w-full"
                                        onClick={handleConfirmDelete}
                                        disabled={confirmText !== 'i_want_delete_my_account' || loading}
                                    >
                                        {loading ? 'Deleting...' : 'Permanently Delete Account'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const Profile = ({ user: initialUser, onLogout, onUserUpdate }) => {
    const navigate = useNavigate();
    const [user, setUser] = useState(initialUser);
    const [activeTab, setActiveTab] = useState('overview');
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...user });
    const [showSuccess, setShowSuccess] = useState(false);
    const [usersList, setUsersList] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [showManageModal, setShowManageModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [activeMenu, setActiveMenu] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [userSettings, setUserSettings] = useState({ dateFormat: 'DD/MM/YYYY', timeFormat: '24h' });

    // User Moderation Modal States
    const [showAddUserModal, setShowAddUserModal] = useState(false);
    const [showEditUserModal, setShowEditUserModal] = useState(false);
    const [showRestrictModal, setShowRestrictModal] = useState(false);
    const [selectedUserForAction, setSelectedUserForAction] = useState(null);
    const [newUserData, setNewUserData] = useState({
        name: '', email: '', password: '', role: 'Telecaller', phone: '', department: '', status: 'Active'
    });
    const [editUserData, setEditUserData] = useState({
        name: '', email: '', role: 'Telecaller', phone: '', department: '', status: 'Active'
    });
    const [restrictionData, setRestrictionData] = useState({
        canMakeCalls: true, canEditLeads: true, canDeleteLeads: false, canViewReports: true, canExport: false
    });
    const [modalLoading, setModalLoading] = useState(false);
    const [modalError, setModalError] = useState(null);
    const [confirmation, setConfirmation] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

    // Load user settings for date/time format
    useEffect(() => {
        const loadSettings = async () => {
            try {
                if (initialUser?.id || initialUser?._id) {
                    const data = await getEffectiveSettings(initialUser.id || initialUser._id, 'system');
                    if (data?.config?.general) {
                        setUserSettings({
                            dateFormat: data.config.general.dateFormat || 'DD/MM/YYYY',
                            timeFormat: data.config.general.timeFormat || '24h'
                        });
                    }
                }
            } catch (err) {
                console.warn('Could not load user settings:', err);
            }
        };
        loadSettings();
    }, [initialUser]);

    // Sync local user state when initialUser prop changes (e.g., after App.jsx syncs from backend)
    useEffect(() => {
        setUser(initialUser);
        setEditData({ ...initialUser });
    }, [initialUser]);

    // Close modals on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === 'Escape') {
                setIsEditing(false);
                setShowManageModal(false);
                setShowUploadModal(false);
                setShowAddUserModal(false);
                setShowEditUserModal(false);
                setShowRestrictModal(false);
            }
        };
        document.addEventListener('keydown', handleEsc);
        return () => document.removeEventListener('keydown', handleEsc);
    }, []);

    // Handle modal overlay click (click outside)
    const handleOverlayClick = (e, closeHandler) => {
        if (e.target === e.currentTarget) {
            closeHandler();
        }
    };

    useEffect(() => {
        if (activeTab === 'moderation') {
            fetchUsers();
        }
    }, [activeTab]);

    const fetchUsers = async () => {
        setLoadingUsers(true);
        try {
            const data = await getUsers();
            setUsersList(data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoadingUsers(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        try {
            await toggleUserStatus(userId);
            fetchUsers();
        } catch (error) {
            alert('Failed to update status');
        }
    };

    const handleUpdateRole = async (userId, newRole) => {
        try {
            // Re-using updateUser for role change
            await updateUser(userId, { role: newRole });
            fetchUsers();
        } catch (error) {
            alert('Failed to update role');
        }
    };

    // Add New User Handler
    const handleAddUser = async () => {
        if (!newUserData.name || !newUserData.email || !newUserData.password) {
            setModalError('Name, email, and password are required');
            return;
        }
        setModalLoading(true);
        setModalError(null);
        try {
            await createUser(newUserData);
            setShowAddUserModal(false);
            setNewUserData({ name: '', email: '', password: '', role: 'Telecaller', phone: '', department: '', status: 'Active' });
            fetchUsers();
        } catch (error) {
            setModalError(error.message || 'Failed to create user');
        } finally {
            setModalLoading(false);
        }
    };

    // Edit User Handler
    const handleOpenEditModal = (u) => {
        setSelectedUserForAction(u);
        setEditUserData({
            name: u.name || '',
            email: u.email || '',
            role: u.role || 'Telecaller',
            phone: u.phone || '',
            department: u.department || '',
            status: u.status || 'Active'
        });
        setModalError(null);
        setShowEditUserModal(true);
    };

    const handleSaveEditUser = async () => {
        if (!editUserData.name) {
            setModalError('Name is required');
            return;
        }
        setModalLoading(true);
        setModalError(null);
        try {
            await updateUser(selectedUserForAction._id, editUserData);
            setShowEditUserModal(false);
            setSelectedUserForAction(null);
            fetchUsers();
        } catch (error) {
            setModalError(error.message || 'Failed to update user');
        } finally {
            setModalLoading(false);
        }
    };

    // Delete User Handler
    const handleDeleteUser = async (userId) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete User',
            message: 'Are you sure you want to delete this user? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await deleteUser(userId);
                    fetchUsers();
                } catch (error) {
                    alert('Failed to delete user: ' + (error.message || 'Unknown error'));
                }
                setConfirmation(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    // Access Restriction Handler
    const handleOpenRestrictModal = (u) => {
        setSelectedUserForAction(u);
        setRestrictionData({
            canMakeCalls: u.permissions?.canMakeCalls ?? true,
            canEditLeads: u.permissions?.canEditLeads ?? true,
            canDeleteLeads: u.permissions?.canDeleteLeads ?? false,
            canViewReports: u.permissions?.canViewReports ?? true,
            canExport: u.permissions?.canExport ?? false
        });
        setModalError(null);
        setShowRestrictModal(true);
    };

    const handleSaveRestrictions = async () => {
        setModalLoading(true);
        setModalError(null);
        try {
            await updateUserPermissions(selectedUserForAction._id, restrictionData);
            setShowRestrictModal(false);
            setSelectedUserForAction(null);
            fetchUsers();
        } catch (error) {
            setModalError(error.message || 'Failed to update permissions');
        } finally {
            setModalLoading(false);
        }
    };

    const isSuperAdmin = user?.role === 'SuperAdmin' || user?.email === 'ajay22071997barman@gmail.com';
    const isAdmin = user?.role === 'Admin' || isSuperAdmin;

    const handleSaveProfile = async () => {
        try {
            const updated = await updateUser(user.id || user._id, { name: editData.name });
            setUser({ ...user, name: updated.name });
            if (onUserUpdate) onUserUpdate({ ...user, name: updated.name });

            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setIsEditing(false);
            }, 1500);
        } catch (error) {
            alert('Failed to update profile');
        }
    };

    // Avatar upload handlers
    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('File size must be less than 5MB');
            return;
        }

        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setShowManageModal(false); // Close manage modal
        setShowUploadModal(true); // Open upload preview modal
    };

    const handleUploadAvatar = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            const result = await uploadAvatar(selectedFile);

            // Update local state
            const updatedUser = {
                ...user,
                avatar: result.user.avatar,
                avatarHistory: result.user.avatarHistory,
                googleAvatar: result.user.googleAvatar,
                isCustomAvatar: result.user.isCustomAvatar
            };
            setUser(updatedUser);
            if (onUserUpdate) onUserUpdate(updatedUser);

            setShowUploadModal(false);
            setSelectedFile(null);
            setPreviewUrl(null);
            // Re-open manage modal to show new result
            setShowManageModal(true);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 2000);
        } catch (error) {
            alert(error.message || 'Failed to upload avatar');
        } finally {
            setUploading(false);
        }
    };

    const handleSelectAvatar = async (url) => {
        try {
            const result = await selectAvatar(url);

            // Update local state
            const updatedUser = {
                ...user,
                avatar: result.user.avatar,
                isCustomAvatar: result.user.isCustomAvatar
            };
            setUser(updatedUser);
            if (onUserUpdate) onUserUpdate(updatedUser);

            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 1500);
        } catch (error) {
            alert(error.message || 'Failed to select avatar');
        }
    };

    return (
        <div className="profile-page" >
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                onClose={() => setConfirmation(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmation.onConfirm}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
            />
            <div className="profile-header card">
                <div className="profile-cover"></div>
                <div className="profile-user-section">
                    <div className="profile-avatar large" onClick={() => setShowManageModal(true)} style={{ position: 'relative', cursor: 'pointer' }}>
                        {user.avatar ? (
                            <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                        ) : (
                            user.name.charAt(0)
                        )}
                        <div
                            className="avatar-upload-overlay"
                            title="Manage Profile Picture"
                        >
                            <i className="ri-camera-line"></i>
                        </div>
                    </div>
                    <input
                        id="avatar-input"
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileSelect}
                    />
                    <div className="profile-main-info">
                        <div className="name-row">
                            <h1>{user.name}</h1>
                            <span className={`role-badge ${user.role.toLowerCase()}`}>{user.role}</span>
                        </div>
                        <p className="email-text"><i className="ri-mail-line"></i> {user.email}</p>
                    </div>
                    <div className="profile-actions">
                        <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap', gap: '0.75rem' }} onClick={() => setIsEditing(true)}>
                            <i className="ri-edit-line"></i> Edit Profile
                        </button>
                        <button className="logout-btn" onClick={() => { localStorage.clear(); navigate('/login'); window.location.reload(); }}>
                            <i className="ri-logout-box-r-line"></i> Logout
                        </button>
                    </div>
                </div>
            </div>

            {isEditing && (
                <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setIsEditing(false))}>
                    <div className="modal-content card" style={{ maxWidth: '500px', width: '90%' }}>
                        <div className="modal-header">
                            <h3>Edit Profile</h3>
                            <button className="close-btn" onClick={() => setIsEditing(false)}>&times;</button>
                        </div>
                        <div className="modal-body">
                            <div className="form-group mb-4">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div className="form-group mb-4">
                                <label>Email Address</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={editData.email}
                                    disabled
                                />
                                <small className="text-secondary">Email cannot be changed.</small>
                            </div>
                            {showSuccess && (
                                <div className="p-3 bg-green-100 text-green-700 rounded mb-4 text-center">
                                    <i className="ri-checkbox-circle-line mr-2"></i>
                                    Profile updated successfully!
                                </div>
                            )}
                        </div>
                        <div className="modal-footer">
                            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
                            <button className="btn btn-primary" onClick={handleSaveProfile}>Save Changes</button>
                        </div>
                    </div>
                </div>
            )}

            {
                showManageModal && (
                    <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowManageModal(false))}>
                        <div className="modal-content card" style={{ maxWidth: '480px', width: '90%' }}>
                            <div className="modal-header">
                                <h3>Profile Picture</h3>
                                <button className="close-btn" onClick={() => setShowManageModal(false)}>×</button>
                            </div>
                            <div className="modal-body" style={{ textAlign: 'center' }}>
                                {/* Main Avatar */}
                                <div className="main-avatar-container"
                                    onMouseEnter={() => setActiveMenu('main-hover')}
                                    onMouseLeave={() => setActiveMenu(null)}
                                    style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 2rem' }}
                                >
                                    <img
                                        src={user.avatar || user.googleAvatar}
                                        alt="Current Profile"
                                        referrerPolicy="no-referrer"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = `https://ui-avatars.com/api/?name=${user.name}&background=random`
                                        }}
                                        style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', border: '4px solid var(--border)' }}
                                    />
                                    <div className="avatar-edit-overlay" style={{
                                        position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                                        background: 'rgba(0,0,0,0.5)', borderRadius: '50%', display: activeMenu === 'main-hover' || activeMenu === 'main-menu' ? 'flex' : 'none',
                                        alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: 'white', cursor: 'pointer'
                                    }} onClick={() => setActiveMenu(activeMenu === 'main-menu' ? null : 'main-menu')}>
                                        <i className="ri-pencil-line" style={{ fontSize: '2rem' }}></i>
                                        <span>Edit</span>
                                    </div>

                                    {activeMenu === 'main-menu' && (
                                        <div className="avatar-menu-popover" style={{
                                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                                            background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                            zIndex: 10, overflow: 'hidden', width: '160px', textAlign: 'left'
                                        }}>
                                            <div className="menu-item" onClick={() => window.open(user.avatar || user.googleAvatar, '_blank')}
                                                style={{ padding: '10px 15px', color: '#333', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                <i className="ri-external-link-line mr-2"></i> View Full Size
                                            </div>
                                            <div className="menu-item" onClick={() => document.getElementById('avatar-input').click()}
                                                style={{ padding: '10px 15px', color: '#333', cursor: 'pointer' }}>
                                                <i className="ri-upload-cloud-line mr-2"></i> Upload New
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* History Section */}
                                <div className="history-section" style={{ textAlign: 'left' }}>
                                    <h4 style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Previous Photos</h4>
                                    <div className="history-grid" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                        {/* Google Avatar */}
                                        {user.googleAvatar && (
                                            <div className="history-item" style={{ position: 'relative' }}
                                                onClick={() => setActiveMenu(activeMenu === 'google' ? null : 'google')}>
                                                <img
                                                    src={user.googleAvatar}
                                                    alt="Google"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => e.target.style.display = 'none'}
                                                    style={{
                                                        width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer',
                                                        border: !user.isCustomAvatar && user.avatar === user.googleAvatar ? '2px solid var(--primary)' : '1px solid var(--border)'
                                                    }}
                                                />
                                                {activeMenu === 'google' && (
                                                    <div className="avatar-menu-popover" style={{
                                                        position: 'absolute', bottom: '100%', left: '0', marginBottom: '5px',
                                                        background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        zIndex: 10, width: '150px'
                                                    }}>
                                                        <div className="menu-item" onClick={() => window.open(user.googleAvatar, '_blank')}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                            View Full Size
                                                        </div>
                                                        <div className="menu-item" onClick={() => handleSelectAvatar(user.googleAvatar)}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                            Set as Profile
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Facebook Avatar */}
                                        {user.facebookAvatar && (
                                            <div className="history-item" style={{ position: 'relative' }}
                                                onClick={() => setActiveMenu(activeMenu === 'facebook' ? null : 'facebook')}>
                                                <img
                                                    src={getFacebookAvatarUrl(user)}
                                                    alt="Facebook"
                                                    referrerPolicy="no-referrer"
                                                    onError={(e) => {
                                                        // Fallback to UI Avatars with FB Blue
                                                        e.target.onerror = null;
                                                        e.target.src = `https://ui-avatars.com/api/?name=FB&background=1877F2&color=fff&font-size=0.5`;
                                                    }}
                                                    style={{
                                                        width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer',
                                                        border: !user.isCustomAvatar && (user.avatar === user.facebookAvatar || (getFacebookAvatarUrl(user) && user.avatar === getFacebookAvatarUrl(user))) ? '2px solid var(--primary)' : '1px solid var(--border)'
                                                    }}
                                                />
                                                {activeMenu === 'facebook' && (
                                                    <div className="avatar-menu-popover" style={{
                                                        position: 'absolute', bottom: '100%', left: '0', marginBottom: '5px',
                                                        background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        zIndex: 10, width: '150px'
                                                    }}>
                                                        <div className="menu-item" onClick={() => window.open(getFacebookAvatarUrl(user), '_blank')}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                            View Full Size
                                                        </div>
                                                        <div className="menu-item" onClick={() => handleSelectAvatar(getFacebookAvatarUrl(user))}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                            Set as Profile
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Microsoft Avatar */}
                                        {user.microsoftAvatar && (
                                            <div className="history-item" style={{ position: 'relative' }}
                                                onClick={() => setActiveMenu(activeMenu === 'microsoft' ? null : 'microsoft')}>
                                                <img
                                                    src={user.microsoftAvatar}
                                                    alt="Microsoft"
                                                    referrerPolicy="no-referrer"
                                                    style={{
                                                        width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer',
                                                        border: !user.isCustomAvatar && user.avatar === user.microsoftAvatar ? '2px solid var(--primary)' : '1px solid var(--border)'
                                                    }}
                                                />
                                                {activeMenu === 'microsoft' && (
                                                    <div className="avatar-menu-popover" style={{
                                                        position: 'absolute', bottom: '100%', left: '0', marginBottom: '5px',
                                                        background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        zIndex: 10, width: '150px'
                                                    }}>
                                                        <div className="menu-item" onClick={() => window.open(user.microsoftAvatar, '_blank')}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                            View Full Size
                                                        </div>
                                                        <div className="menu-item" onClick={() => handleSelectAvatar(user.microsoftAvatar)}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                            Set as Profile
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* History Items */}
                                        {user.avatarHistory && user.avatarHistory.map((url, index) => (
                                            <div key={index} className="history-item" style={{ position: 'relative' }}
                                                onClick={() => setActiveMenu(activeMenu === `history-${index}` ? null : `history-${index}`)}>
                                                <img src={url} alt="History" style={{
                                                    width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', cursor: 'pointer',
                                                    border: user.isCustomAvatar && user.avatar === url ? '2px solid var(--primary)' : '1px solid var(--border)'
                                                }} />
                                                {activeMenu === `history-${index}` && (
                                                    <div className="avatar-menu-popover" style={{
                                                        position: 'absolute', bottom: '100%', left: '0', marginBottom: '5px',
                                                        background: 'white', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                                                        zIndex: 10, width: '150px'
                                                    }}>
                                                        <div className="menu-item" onClick={() => window.open(url, '_blank')}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}>
                                                            View Full Size
                                                        </div>
                                                        <div className="menu-item" onClick={() => handleSelectAvatar(url)}
                                                            style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                                            Set as Profile
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                showUploadModal && (
                    <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowUploadModal(false))}>
                        <div className="modal-content card" style={{ maxWidth: '520px', width: '90%' }}>
                            <div className="modal-header">
                                <h3>Upload Profile Picture</h3>
                                <button className="close-btn" onClick={() => setShowUploadModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {previewUrl && (
                                    <div className="avatar-preview" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            style={{
                                                width: '200px',
                                                height: '200px',
                                                borderRadius: '50%',
                                                objectFit: 'cover',
                                                margin: '0 auto',
                                                display: 'block',
                                                border: '4px solid var(--border)'
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="upload-info" style={{ textAlign: 'center' }}>
                                    <p className="text-secondary text-sm">
                                        <i className="ri-information-line"></i>
                                        Recommended: Square image, at least 200x200px
                                    </p>
                                    <p className="text-secondary text-xs">
                                        Maximum file size: 5MB
                                    </p>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUploadAvatar}
                                    disabled={uploading}
                                >
                                    {uploading ? (
                                        <>
                                            <i className="ri-loader-4-line animate-spin"></i> Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="ri-upload-cloud-line"></i> Upload
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            <div className="profile-content-grid">
                <div className="profile-sidebar">
                    <div className="profile-menu card">
                        <button
                            className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}
                            onClick={() => setActiveTab('overview')}
                        >
                            <i className="ri-user-3-line"></i> Overview
                        </button>
                        <button
                            className={`menu-item ${activeTab === 'permissions' ? 'active' : ''}`}
                            onClick={() => setActiveTab('permissions')}
                        >
                            <i className="ri-shield-keyhole-line"></i> My Permissions
                        </button>
                        {isAdmin && (
                            <button
                                className={`menu-item ${activeTab === 'moderation' ? 'active' : ''}`}
                                onClick={() => setActiveTab('moderation')}
                            >
                                <i className="ri-admin-line"></i> User Moderation
                            </button>
                        )}
                        <button
                            className={`menu-item ${activeTab === 'security' ? 'active' : ''}`}
                            onClick={() => setActiveTab('security')}
                        >
                            <i className="ri-lock-2-line"></i> Security Settings
                        </button>
                    </div>

                    <div className="stats-mini card">
                        <h4>Account Activity</h4>
                        <div className="mini-stat">
                            <span>Last Login</span>
                            <strong>{formatDateTime(user.lastLogin || new Date(), userSettings)}</strong>
                        </div>
                        <div className="mini-stat">
                            <span>Total Calls</span>
                            <strong>124</strong>
                        </div>
                    </div>
                </div>

                <div className="profile-main">
                    {activeTab === 'overview' && (
                        <div className="overview-pane card">
                            <h3>Account Overview</h3>
                            <div className="data-grid">
                                <div className="data-item">
                                    <label>Full Name</label>
                                    <p>{user.name}</p>
                                </div>
                                <div className="data-item">
                                    <label>Role</label>
                                    <p>{user.role}</p>
                                </div>
                                <div className="data-item">
                                    <label>Status</label>
                                    <p className="status-active">● Active</p>
                                </div>
                                <div className="data-item">
                                    <label>User ID</label>
                                    <p className="text-secondary text-sm font-mono">{user.id || 'N/A'}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'permissions' && (
                        <div className="permissions-pane card">
                            <h3>Assigned Permissions</h3>
                            <p className="text-secondary mb-4">You have the following access rights in the system.</p>
                            <div className="permissions-list">
                                {user.permissions && user.permissions.includes('ALL') ? (
                                    <div className="permission-card super">
                                        <i className="ri-shield-flash-fill text-yellow-500"></i>
                                        <div>
                                            <h4>Full Developer Access</h4>
                                            <p>All system permissions granted by SuperAdmin role.</p>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="permission-card">
                                            <i className="ri-checkbox-circle-fill text-green-500"></i>
                                            <div>
                                                <h4>View Leads</h4>
                                                <p>Ability to view and search lead database</p>
                                            </div>
                                        </div>
                                        <div className="permission-card">
                                            <i className="ri-checkbox-circle-fill text-green-500"></i>
                                            <div>
                                                <h4>Make Calls</h4>
                                                <p>Ability to initiate calls to assigned leads</p>
                                            </div>
                                        </div>
                                        {isAdmin && (
                                            <div className="permission-card admin">
                                                <i className="ri-shield-star-fill text-blue-500"></i>
                                                <div>
                                                    <h4>System Management</h4>
                                                    <p>Full access to settings and user moderation</p>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <SecuritySettings user={user} navigate={navigate} /> // We will define this component internally or use logic here
                    )}

                    {activeTab === 'moderation' && isAdmin && (
                        <div className="moderation-pane card">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3>{isSuperAdmin ? 'System Control & Moderation' : 'User Moderation'}</h3>
                                    <p className="text-secondary text-sm">Manage user access, roles, and status.</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setNewUserData({ name: '', email: '', password: '', role: 'Telecaller', phone: '', department: '', status: 'Active' });
                                            setModalError(null);
                                            setShowAddUserModal(true);
                                        }}
                                    >
                                        <i className="ri-user-add-line mr-2"></i>
                                        Add User
                                    </button>
                                    {isSuperAdmin && (
                                        <div className="role-switcher-inline flex gap-2 p-2 rounded-lg border" style={{ background: 'var(--bg-main)' }}>
                                            <span className="text-xs font-bold uppercase flex items-center px-2" style={{ color: 'var(--text-secondary)' }}>Role Switcher:</span>
                                            {['SuperAdmin', 'Admin', 'Telecaller', 'Viewer'].map(r => (
                                                <button
                                                    key={r}
                                                    className={`btn btn-xs ${user.role === r ? 'btn-primary' : 'btn-secondary'}`}
                                                    style={{ fontSize: '10px', padding: '2px 8px' }}
                                                    onClick={() => {
                                                        const newUser = { ...user, role: r };
                                                        localStorage.setItem('user', JSON.stringify(newUser));
                                                        window.location.reload();
                                                    }}
                                                >
                                                    {r}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {loadingUsers ? (
                                <div className="p-8 text-center">
                                    <i className="ri-loader-4-line animate-spin text-2xl mb-2 block text-primary"></i>
                                    Fetching users...
                                </div>
                            ) : usersList.length === 0 ? (
                                <div className="p-8 text-center text-secondary">
                                    <i className="ri-user-search-line text-3xl mb-2 block"></i>
                                    No users found in the system.
                                </div>
                            ) : (
                                <div className="moderation-controls overflow-x-auto">
                                    <table className="leads-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Role</th>
                                                <th>Last Login</th>
                                                <th>Status</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {usersList.map((u) => (
                                                <tr key={u._id}>
                                                    <td>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${u.role === 'SuperAdmin' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                {u.name.charAt(0)}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{u.name}</span>
                                                                <span className="text-xs text-secondary">{u.email}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <select
                                                            className="form-select text-xs p-1"
                                                            value={u.role}
                                                            onChange={(e) => handleUpdateRole(u._id, e.target.value)}
                                                            disabled={u.email === user.email || (u.role === 'SuperAdmin' && !isSuperAdmin)}
                                                        >
                                                            <option value="SuperAdmin">SuperAdmin</option>
                                                            <option value="Admin">Admin</option>
                                                            <option value="Telecaller">Telecaller</option>
                                                            <option value="Viewer">Viewer</option>
                                                        </select>
                                                    </td>
                                                    <td>
                                                        <span className="text-xs text-secondary">
                                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${u.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                                                            {u.status || 'Active'}
                                                        </span>
                                                    </td>
                                                    <td className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => handleOpenRestrictModal(u)}
                                                                disabled={u.email === user.email || (u.role === 'SuperAdmin' && !isSuperAdmin)}
                                                                title="Access Restrictions"
                                                            >
                                                                <i className="ri-shield-keyhole-line text-purple-600"></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => handleOpenEditModal(u)}
                                                                disabled={u.email === user.email || (u.role === 'SuperAdmin' && !isSuperAdmin)}
                                                                title="Edit User"
                                                            >
                                                                <i className="ri-edit-line text-blue-600"></i>
                                                            </button>
                                                            <button
                                                                className={`btn btn-sm ${u.status === 'Suspended' ? 'btn-success' : 'btn-secondary'}`}
                                                                onClick={() => handleToggleStatus(u._id)}
                                                                disabled={u.email === user.email || (u.role === 'SuperAdmin' && !isSuperAdmin)}
                                                                title={u.status === 'Suspended' ? 'Activate User' : 'Suspend User'}
                                                            >
                                                                <i className={u.status === 'Suspended' ? "ri-user-follow-line" : "ri-user-forbid-line"}></i>
                                                            </button>
                                                            <button
                                                                className="btn btn-sm btn-secondary"
                                                                onClick={() => handleDeleteUser(u._id)}
                                                                disabled={u.email === user.email || (u.role === 'SuperAdmin' && !isSuperAdmin)}
                                                                title="Delete User"
                                                            >
                                                                <i className="ri-delete-bin-line text-red-600"></i>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Add User Modal */}
            {
                showAddUserModal && (
                    <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowAddUserModal(false))}>
                        <div className="modal-content card" style={{ maxWidth: '600px', width: '90%' }}>
                            <div className="modal-header">
                                <h3>Add New User</h3>
                                <button className="close-btn" onClick={() => setShowAddUserModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {modalError && <div className="alert alert-danger mb-4">{modalError}</div>}
                                <div className="settings-grid-2 gap-4">
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={newUserData.name}
                                            onChange={e => setNewUserData({ ...newUserData, name: e.target.value })}
                                            placeholder="John Doe"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Email Address <span className="text-red-500">*</span></label>
                                        <input
                                            type="email"
                                            value={newUserData.email}
                                            onChange={e => setNewUserData({ ...newUserData, email: e.target.value })}
                                            placeholder="john@example.com"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Password <span className="text-red-500">*</span></label>
                                        <input
                                            type="password"
                                            value={newUserData.password}
                                            onChange={e => setNewUserData({ ...newUserData, password: e.target.value })}
                                            placeholder="••••••••"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Role</label>
                                        <select
                                            value={newUserData.role}
                                            onChange={e => setNewUserData({ ...newUserData, role: e.target.value })}
                                        >
                                            <option value="Telecaller">Telecaller</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Viewer">Viewer</option>
                                            {isSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            value={newUserData.phone}
                                            onChange={e => setNewUserData({ ...newUserData, phone: e.target.value })}
                                            placeholder="+1 234 567 890"
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            value={newUserData.department}
                                            onChange={e => setNewUserData({ ...newUserData, department: e.target.value })}
                                            placeholder="Sales, Support, etc."
                                        />
                                    </div>
                                    <div className="form-group" style={{ marginBottom: '0' }}>
                                        <label>Status</label>
                                        <select
                                            value={newUserData.status}
                                            onChange={e => setNewUserData({ ...newUserData, status: e.target.value })}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Suspended">Suspended</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button className="btn btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleAddUser} disabled={modalLoading}>
                                        {modalLoading ? <><i className="ri-loader-4-line spin mr-2"></i> Creating...</> : 'Create User'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Edit User Modal */}
            {
                showEditUserModal && (
                    <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowEditUserModal(false))}>
                        <div className="modal-content card" style={{ maxWidth: '600px', width: '90%' }}>
                            <div className="modal-header">
                                <h3>Edit User</h3>
                                <button className="close-btn" onClick={() => setShowEditUserModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                {modalError && <div className="alert alert-danger mb-4">{modalError}</div>}
                                <div className="settings-grid-2 gap-4">
                                    <div className="form-group mb-0">
                                        <label>Full Name <span className="text-red-500">*</span></label>
                                        <input
                                            type="text"
                                            value={editUserData.name}
                                            onChange={e => setEditUserData({ ...editUserData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Email Address</label>
                                        <input
                                            type="email"
                                            value={editUserData.email}
                                            disabled
                                            className="bg-gray-100 cursor-not-allowed"
                                            title="Email cannot be changed"
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Role</label>
                                        <select
                                            value={editUserData.role}
                                            onChange={e => setEditUserData({ ...editUserData, role: e.target.value })}
                                            disabled={selectedUserForAction?.role === 'SuperAdmin' && !isSuperAdmin}
                                        >
                                            <option value="Telecaller">Telecaller</option>
                                            <option value="Admin">Admin</option>
                                            <option value="Viewer">Viewer</option>
                                            {isSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                                        </select>
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Phone</label>
                                        <input
                                            type="text"
                                            value={editUserData.phone}
                                            onChange={e => setEditUserData({ ...editUserData, phone: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Department</label>
                                        <input
                                            type="text"
                                            value={editUserData.department}
                                            onChange={e => setEditUserData({ ...editUserData, department: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group mb-0">
                                        <label>Status</label>
                                        <select
                                            value={editUserData.status}
                                            onChange={e => setEditUserData({ ...editUserData, status: e.target.value })}
                                            disabled={selectedUserForAction?.role === 'SuperAdmin' && !isSuperAdmin}
                                        >
                                            <option value="Active">Active</option>
                                            <option value="Suspended">Suspended</option>
                                            <option value="Inactive">Inactive</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button className="btn btn-secondary" onClick={() => setShowEditUserModal(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSaveEditUser} disabled={modalLoading}>
                                        {modalLoading ? <><i className="ri-loader-4-line spin mr-2"></i> Saving...</> : 'Save Changes'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Access Restriction Modal */}
            {
                showRestrictModal && (
                    <div className="modal-overlay" onClick={(e) => handleOverlayClick(e, () => setShowRestrictModal(false))}>
                        <div className="modal-content card" style={{ maxWidth: '500px', width: '90%' }}>
                            <div className="modal-header">
                                <h3>Access Restrictions</h3>
                                <button className="close-btn" onClick={() => setShowRestrictModal(false)}>×</button>
                            </div>
                            <div className="modal-body">
                                <p className="text-sm text-gray-500 mb-4">
                                    Configure granular permissions for <strong>{selectedUserForAction?.name}</strong>.
                                </p>
                                {modalError && <div className="alert alert-danger mb-4">{modalError}</div>}

                                <div className="space-y-3">
                                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <span className="font-medium block">Make Calls</span>
                                            <span className="text-xs text-secondary">Allow user to initiate calls via integrated dialer</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary"
                                            checked={restrictionData.canMakeCalls}
                                            onChange={e => setRestrictionData({ ...restrictionData, canMakeCalls: e.target.checked })}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <span className="font-medium block">Edit Leads</span>
                                            <span className="text-xs text-secondary">Allow modifying lead details and status</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary"
                                            checked={restrictionData.canEditLeads}
                                            onChange={e => setRestrictionData({ ...restrictionData, canEditLeads: e.target.checked })}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <span className="font-medium block">Delete Leads</span>
                                            <span className="text-xs text-secondary"><strong>Danger Zone:</strong> Allow permanent removal of leads</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-red-500"
                                            checked={restrictionData.canDeleteLeads}
                                            onChange={e => setRestrictionData({ ...restrictionData, canDeleteLeads: e.target.checked })}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <span className="font-medium block">View Reports</span>
                                            <span className="text-xs text-secondary">Access to analytics and performance stats</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary"
                                            checked={restrictionData.canViewReports}
                                            onChange={e => setRestrictionData({ ...restrictionData, canViewReports: e.target.checked })}
                                        />
                                    </label>
                                    <label className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer">
                                        <div>
                                            <span className="font-medium block">Export Data</span>
                                            <span className="text-xs text-secondary">Allow downloading leads and reports as CSV</span>
                                        </div>
                                        <input
                                            type="checkbox"
                                            className="w-5 h-5 text-primary"
                                            checked={restrictionData.canExport}
                                            onChange={e => setRestrictionData({ ...restrictionData, canExport: e.target.checked })}
                                        />
                                    </label>
                                </div>

                                <div className="flex justify-end gap-2 mt-6">
                                    <button className="btn btn-secondary" onClick={() => setShowRestrictModal(false)}>Cancel</button>
                                    <button className="btn btn-primary" onClick={handleSaveRestrictions} disabled={modalLoading}>
                                        {modalLoading ? <><i className="ri-loader-4-line spin mr-2"></i> Saving...</> : 'Save Permissions'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default Profile;
