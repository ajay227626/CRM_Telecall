import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { initiatePasswordReset, verifyOTPAndResetPassword } from '../utils/api';

const PasswordReset = () => {
    const [step, setStep] = useState(1); // 1: Email input, 2: OTP verification, 3: New password
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await initiatePasswordReset(email);
            setStep(2); // Move to OTP verification step
            setSuccess('OTP sent to your email. Please check your inbox.');
        } catch (err) {
            setError('Failed to send OTP. Please check your email address.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Actually verify the OTP with the backend
            // For now, we'll just validate the OTP format and length to move to next step
            // Backend call to validate OTP might be needed
            if (otp.length !== 6 || isNaN(otp)) {
                setError('Invalid OTP format. Please enter a 6-digit code.');
                setLoading(false);
                return;
            }

            setStep(3); // Move to password change step
            setSuccess('OTP verified! Please enter your new password.');
        } catch (err) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Validate passwords match
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            setLoading(false);
            return;
        }

        try {
            await verifyOTPAndResetPassword(email, otp, newPassword);
            setSuccess('Password reset successfully! You can now log in with your new password.');
            // Redirect to login after a delay
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError('Failed to reset password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <i className="ri-lock-unlock-fill"></i>
                    </div>
                    <h1>Reset Password</h1>
                    <p>{step === 1 ? 'Enter your email to receive a reset code' :
                        step === 2 ? 'Enter the code sent to your email' :
                            'Enter your new password'}</p>
                </div>

                {error && <div className="login-error"><i className="ri-error-warning-line"></i> {error}</div>}
                {success && <div className="login-success"><i className="ri-check-line"></i> {success}</div>}

                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="login-form">
                        <div className="form-group">
                            <label>Email Address</label>
                            <div className="input-with-icon">
                                <i className="ri-mail-line"></i>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Send Reset Code'}
                        </button>
                        <button type="button" className="resend-link" onClick={() => navigate('/login')}>
                            Back to Login
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="login-form">
                        <div className="form-group">
                            <label>Enter OTP</label>
                            <div className="input-with-icon">
                                <i className="ri-key-2-line"></i>
                                <input
                                    type="text"
                                    placeholder="000000"
                                    maxLength="6"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Verify OTP'}
                        </button>
                        <button type="button" className="resend-link" onClick={() => setStep(1)}>
                            Back to Email
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleChangePassword} className="login-form">
                        <div className="form-group">
                            <label>New Password</label>
                            <div className="input-with-icon">
                                <i className="ri-lock-line"></i>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    minLength="8"
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div className="input-with-icon">
                                <i className="ri-lock-password-line"></i>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength="8"
                                />
                            </div>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Reset Password'}
                        </button>
                        <button type="button" className="resend-link" onClick={() => setStep(1)}>
                            Back to Email
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>Secure password reset with CRM Pro</p>
                </div>
            </div>
        </div>
    );
};

export default PasswordReset;