import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { requestSetPasswordOTP } from '../utils/api';

const LinkVerification = ({ onLogin }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [token, setToken] = useState('');
    const [provider, setProvider] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [method, setMethod] = useState('password'); // 'password' or 'otp'

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tokenParam = params.get('token');
        const providerParam = params.get('provider');

        if (!tokenParam) {
            setError('Invalid verification link.');
        } else {
            setToken(tokenParam);
            setProvider(providerParam);
        }
    }, [location]);

    const handleSendOTP = async () => {
        setLoading(true);
        setError('');
        try {
            // Re-use existing sendOTP endpoint, but we need email. 
            // Actually, we don't have the email easily accessible here without decoding the token 
            // OR the backend can extract email from the 'token' we passed.
            // Wait, standard 'send-otp' expects { email }. 
            // We can't decode the JWT on client easily without a library if we want to be secure, 
            // but we can parse it.
            // BETTER APPROACH: The backend 'verify-link' should handle OTP generation? 
            // OR we use the generic send-otp but we need the email.
            // Let's decode the token for display purposes anyway (it's not sensitive info if just email).

            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            const decoded = JSON.parse(jsonPayload);

            const response = await fetch('http://localhost:8000/api/auth/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: decoded.email })
            });

            if (!response.ok) throw new Error('Failed to send OTP');
            setOtpSent(true);
            alert('OTP sent to your email!');

        } catch (err) {
            setError(err.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const body = { token };
            if (method === 'password') {
                body.password = password;
            } else {
                body.otp = otp;
            }

            const response = await fetch('http://localhost:8000/api/auth/verify-link', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Success!
            if (onLogin) onLogin(data.user);
            localStorage.setItem('token', data.token); // Save new login token

            // Force a reload to ensure all states (Profile, Sidebar, etc.) are synced fresh from the DB
            window.location.href = '/dashboard';

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!token) return <div className="p-10 text-center text-red-500">{error}</div>;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Link {provider ? provider.charAt(0).toUpperCase() + provider.slice(1) : 'Account'}
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    An account with this email already exists. <br />
                    Please verify your identity to link them.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {error && (
                        <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                            <div className="flex">
                                <div className="ml-3">
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex justify-center mb-6 space-x-4">
                        <button
                            onClick={() => setMethod('password')}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${method === 'password'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Use Password
                        </button>
                        <button
                            onClick={() => setMethod('otp')}
                            className={`px-4 py-2 text-sm font-medium rounded-md ${method === 'otp'
                                ? 'bg-indigo-100 text-indigo-700'
                                : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            Use OTP
                        </button>
                    </div>

                    <form className="space-y-6" onSubmit={handleVerify}>
                        {method === 'password' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Password
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    One-Time Password (OTP)
                                </label>
                                <div className="mt-1 flex gap-2">
                                    <input
                                        type="text"
                                        required={method === 'otp'}
                                        // placeholder="Enter OTP"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleSendOTP}
                                        disabled={loading || otpSent}
                                        className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                    >
                                        {otpSent ? 'Sent' : 'Send Code'}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-gray-500">
                                    We'll send a code to your registered email.
                                </p>
                            </div>
                        )}

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                            >
                                {loading ? 'Verifying...' : 'Verify & Link Account'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center">
                        <Link to="/login" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                            Cancel and Return to Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LinkVerification;
