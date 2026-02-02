import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { sendOTP, verifyOTP, login } from '../utils/api';
import notify from '../utils/toast.jsx';

const Login = ({ onLogin }) => {
    const [step, setStep] = useState(1); // 1: Login Options, 2: Email/Password, 3: OTP Login, 4: Register
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // New state for password visibility
    const [otp, setOtp] = useState('');
    const [fullName, setFullName] = useState('');
    const [loading, setLoading] = useState(false);
    // const [error, setError] = useState(''); // Removed in favor of toast, or keep for inline? Let's keep inline for form feedback but add toast for major actions
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await login(email, password);

            // Store user data and token from real API response
            localStorage.setItem('user', JSON.stringify(response.user));
            localStorage.setItem('token', response.token);

            if (onLogin) onLogin(response.user);
            notify.success(`Welcome back, ${response.user.name || 'User'}!`);
            navigate('/');
        } catch (err) {
            console.error(err);
            setError('Login failed. Please check your credentials.');
            // Toast is already handled in api.js for login failure, but specific form feedback is good too.
        } finally {
            setLoading(false);
        }
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await sendOTP(email);
            notify.success('OTP sent to your email!');
            setStep(4); // Go to OTP verification step
        } catch (err) {
            setError('Failed to send OTP. Please check your email.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const result = await verifyOTP(email, otp);
            // For login OTP verification
            localStorage.setItem('user', JSON.stringify(result.user));
            localStorage.setItem('token', result.token);
            if (onLogin) onLogin(result.user);
            notify.success('Logged in successfully via OTP');
            navigate('/');
        } catch (err) {
            setError('Invalid OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            // Note: Registration API endpoint would need to be implemented in the backend
            // This is a placeholder implementation showing how it might work
            console.log('Registration would happen here with:', { fullName, email, password });
            setSuccess('Registration successful! Please check your email for verification.');
            notify.success('Registration successful! Please check your email.');
            setStep(1); // Return to login after registration
        } catch (err) {
            setError('Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };


    const handleGoogleLogin = () => {
        // Redirect to backend Google OAuth endpoint
        window.location.href = 'http://localhost:8000/api/auth/google';
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <i className="ri-shield-user-fill"></i>
                    </div>
                    <h1>CRM Pro</h1>
                    {step === 1 && <p>Choose your preferred login method</p>}
                    {step === 2 && <p>Enter your credentials to access your account</p>}
                    {step === 3 && <p>Enter your email to receive an OTP</p>}
                    {step === 4 && <p>Enter the 6-digit code sent to your email</p>}
                    {step === 5 && <p>Create your new account</p>}
                </div>

                {error && <div className="login-error"><i className="ri-error-warning-line"></i> {error}</div>}
                {success && <div className="login-success"><i className="ri-check-line"></i> {success}</div>}

                {step === 1 && (
                    <div className="login-form">
                        <div className="login-methods" style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="login-method-btn"
                                onClick={() => setStep(2)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    background: 'var(--bg-card)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minHeight: '120px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4f46e5';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(79, 70, 229, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f0f9ff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.5rem'
                                }}>
                                    <i className="ri-lock-password-line" style={{ color: '#3b82f6', fontSize: '1rem' }}></i>
                                </div>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>Password</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem', textAlign: 'center' }}>Email & Password</span>
                            </button>

                            <button
                                className="login-method-btn"
                                onClick={() => setStep(3)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    padding: '1rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    background: 'var(--bg-card)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    minHeight: '120px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4f46e5';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(79, 70, 229, 0.1)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.boxShadow = 'none';
                                }}
                            >
                                <div style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: '#f0fdf4',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: '0.5rem'
                                }}>
                                    <i className="ri-mail-line" style={{ color: '#10b981', fontSize: '1rem' }}></i>
                                </div>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>OTP Login</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.1rem', textAlign: 'center' }}>One-time password</span>
                            </button>
                        </div>

                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            margin: '1.5rem 0',
                            fontSize: '0.875rem',
                            color: '#6b7280'
                        }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                            <span style={{ padding: '0 0.75rem', color: 'var(--text-secondary)' }}>or continue with</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                            <button
                                className="social-login-btn"
                                onClick={handleGoogleLogin}
                                title="Continue with Google"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    background: 'var(--bg-card)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    height: '40px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4285f4';
                                    e.currentTarget.style.backgroundColor = '#f8faff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                                }}
                            >
                                <img
                                    src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                                    alt="Google"
                                    style={{ width: '20px', height: '20px' }}
                                />
                            </button>

                            <button
                                className="social-login-btn"
                                onClick={() => window.location.href = 'http://localhost:8000/api/auth/microsoft'}
                                title="Continue with Microsoft"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    background: 'var(--bg-card)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    height: '40px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#00a4ef';
                                    e.currentTarget.style.backgroundColor = '#f8faff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 23 23">
                                    <path fill="#f35325" d="M1 1h10v10H1z" />
                                    <path fill="#81bc06" d="M12 1h10v10H12z" />
                                    <path fill="#05a6f0" d="M1 12h10v10H1z" />
                                    <path fill="#ffba08" d="M12 12h10v10H12z" />
                                </svg>
                            </button>

                            <button
                                className="social-login-btn"
                                onClick={() => window.location.href = 'http://localhost:8000/api/auth/facebook'}
                                title="Continue with Facebook"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    flex: 1,
                                    padding: '0.5rem',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                    background: 'var(--bg-card)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    height: '40px'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#1877F2';
                                    e.currentTarget.style.backgroundColor = '#f8faff';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#e5e7eb';
                                    e.currentTarget.style.backgroundColor = 'var(--bg-card)';
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24">
                                    <path fill="#1877F2" d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                </svg>
                            </button>
                        </div>

                        <div className="login-options" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '1.5rem',
                            fontSize: '0.875rem'
                        }}>
                            <Link
                                to="/password-reset"
                                className="link-button"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--text-secondary)',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    transition: 'all 0.2s',
                                    textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.color = '#4f46e5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                <i className="ri-lock-unlock-line" style={{ fontSize: '0.875rem' }}></i>
                                Forgot Password?
                            </Link>
                            <button
                                type="button"
                                className="link-button"
                                onClick={() => setStep(5)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.color = '#4f46e5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                <i className="ri-user-add-line" style={{ fontSize: '0.875rem' }}></i>
                                Create Account
                            </button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <form onSubmit={handleLogin} className="login-form">
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
                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <i className="ri-lock-line"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    style={{ paddingRight: '40px' }} // Add padding for icon
                                />
                                <i
                                    className={`ri-eye-${showPassword ? 'line' : 'off-line'}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        left: 'auto', // Override global CSS
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        fontSize: '1.2rem',
                                        transition: 'all 0.2s',
                                        zIndex: 10
                                    }}
                                    title={showPassword ? "Hide password" : "Show password"}
                                ></i>
                            </div>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Login with Password'}
                        </button>

                        <div className="login-options" style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            marginTop: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            <button
                                type="button"
                                className="link-button"
                                onClick={() => setStep(1)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.color = '#4f46e5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                <i className="ri-arrow-left-line" style={{ fontSize: '0.875rem' }}></i>
                                Back to Login Options
                            </button>
                            <Link
                                to="/password-reset"
                                className="link-button"
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    transition: 'all 0.2s',
                                    textDecoration: 'none'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.color = '#4f46e5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                <i className="ri-lock-unlock-line" style={{ fontSize: '0.875rem' }}></i>
                                Forgot Password?
                            </Link>
                        </div>
                    </form>
                )}

                {step === 3 && (
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
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Send OTP'}
                        </button>

                        <div className="login-options" style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginTop: '1rem',
                            fontSize: '0.875rem'
                        }}>
                            <button
                                type="button"
                                className="link-button"
                                onClick={() => setStep(1)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    fontWeight: '500',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.25rem',
                                    padding: '0.25rem 0.5rem',
                                    borderRadius: '0.375rem',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => {
                                    e.target.style.background = '#f3f4f6';
                                    e.target.style.color = '#4f46e5';
                                }}
                                onMouseLeave={(e) => {
                                    e.target.style.background = 'none';
                                    e.target.style.color = '#6b7280';
                                }}
                            >
                                <i className="ri-arrow-left-line" style={{ fontSize: '0.875rem' }}></i>
                                Back to Login Options
                            </button>
                        </div>
                    </form>
                )}

                {step === 4 && (
                    <form onSubmit={handleVerifyOTP} className="login-form">
                        <div className="form-group">
                            <label>Verify OTP</label>
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
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Verify & Login'}
                        </button>
                        <button type="button" className="resend-link" onClick={() => setStep(3)}>
                            Back to Email
                        </button>
                    </form>
                )}

                {step === 5 && (
                    <form onSubmit={handleRegister} className="login-form">
                        <div className="form-group">
                            <label>Full Name</label>
                            <div className="input-with-icon">
                                <i className="ri-user-3-line"></i>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
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
                        <div className="form-group">
                            <label>Password</label>
                            <div className="input-with-icon" style={{ position: 'relative' }}>
                                <i className="ri-lock-line"></i>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength="8"
                                    style={{ paddingRight: '40px' }}
                                />
                                <i
                                    className={`ri-eye-${showPassword ? 'line' : 'off-line'}`}
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '12px',
                                        left: 'auto', // Override global CSS
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        color: '#6b7280',
                                        fontSize: '1.2rem',
                                        transition: 'all 0.2s',
                                        zIndex: 10
                                    }}
                                    title={showPassword ? "Hide password" : "Show password"}
                                ></i>
                            </div>
                        </div>
                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <i className="ri-loader-4-line spin"></i> : 'Register'}
                        </button>
                        <button type="button" className="resend-link" onClick={() => setStep(1)}>
                            Back to Login
                        </button>
                    </form>
                )}

                <div className="login-footer">
                    <p>Secured by CRM Pro Auth</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
