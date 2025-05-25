import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleForgotPassword = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setIsSubmitting(true);

        try {
            const response = await fetch('/api/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage('Password reset link has been sent to your email.');
            } else {
                setError(result.error || 'Failed to send password reset link.');
            }
        } catch (error) {
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className='home-container'>
            <div className="login-container">
            <h2 className="login-title">Forgot Password</h2>
            <form onSubmit={handleForgotPassword} className="login-form">
                {error && <p className="error-message">{error}</p>}
                {message && <p style={{ color: '#4caf50', marginBottom: '1rem' }}>{message}</p>}
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="login-input"
                    required
                />
                <button
                    type="submit"
                    className="login-button"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Submitting...' : 'Send Reset Link'}
                </button>
            </form>
            <div className="login-actions">
            <button type="button" className="back-button" style={{ padding: '10px 20px', borderRadius: '5px', backgroundColor: '#6c757d', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => navigate('/dashboard')}>
                Back
            </button>
            </div>
        </div>
        </div>
    );
};

export default ForgotPassword;
