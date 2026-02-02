import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const AuthCallback = ({ onLogin }) => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasProcessed = useRef(false);

    useEffect(() => {
        // Prevent processing multiple times
        if (hasProcessed.current) return;

        const token = searchParams.get('token');
        const userDataString = searchParams.get('user');

        console.log('AuthCallback - Token:', token ? 'Present' : 'Missing');
        console.log('AuthCallback - User Data:', userDataString ? 'Present' : 'Missing');
        console.log('AuthCallback - Full URL:', window.location.href);

        if (token && userDataString) {
            try {
                // Decode and parse user data
                const userData = JSON.parse(decodeURIComponent(userDataString));
                console.log('AuthCallback - Parsed user data:', userData);

                // Store token and user data
                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(userData));

                // Mark as processed
                hasProcessed.current = true;

                // Call onLogin callback if provided
                if (onLogin) {
                    onLogin(userData);
                }

                // Redirect to dashboard
                console.log('AuthCallback - Redirecting to dashboard');
                navigate('/', { replace: true });
            } catch (error) {
                console.error('Error processing auth callback:', error);
                navigate('/login', { replace: true });
            }
        } else {
            // No token or user data, redirect to login
            console.log('AuthCallback - Missing token or user data, redirecting to login');
            navigate('/login', { replace: true });
        }
    }, [searchParams, navigate]); // Removed onLogin from dependencies

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            flexDirection: 'column',
            gap: '1rem'
        }}>
            <i className="ri-loader-4-line spin" style={{ fontSize: '3rem', color: '#4f46e5' }}></i>
            <p style={{ color: '#6b7280', fontSize: '1.125rem' }}>Completing sign in...</p>
        </div>
    );
};

export default AuthCallback;
