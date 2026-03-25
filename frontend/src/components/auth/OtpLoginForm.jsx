import React, { useState } from 'react';
import Turnstile from 'react-turnstile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const OtpLoginForm = () => {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const turnstileSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test site key
  const { sendOtp, verifyOtpLogin } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!captchaToken) {
      setError('Please complete security check first');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(email, captchaToken);
      setOtpSent(true);
      setSuccessMessage('OTP sent to your email');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      await verifyOtpLogin(email, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="auth-register-form">
      {error && <div className="auth-alert auth-alert-error">{error}</div>}
      {successMessage && <div className="auth-alert auth-alert-success">{successMessage}</div>}

      <div className="auth-field">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={otpSent}
        />
      </div>

      {!otpSent && (
        <div className="auth-field">
          <label>Security Check:</label>
          <div className="captcha-shell">
            <Turnstile
              sitekey={turnstileSiteKey}
              onVerify={(token) => setCaptchaToken(token)}
              theme="dark"
            />
          </div>
        </div>
      )}

      {otpSent && (
        <div className="auth-field">
          <label>OTP:</label>
          <input
            type="text"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            maxLength={6}
            required
          />
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Please wait...' : otpSent ? 'Verify OTP' : 'Send OTP'}
      </button>
    </form>
  );
};

export default OtpLoginForm;
