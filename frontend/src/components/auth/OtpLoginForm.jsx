import React, { useState } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
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

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';
  const { sendOtp, verifyOtpLogin } = useAuth();
  const navigate = useNavigate();

  const handleSendOtp = async (event) => {
    event.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!captchaToken) {
      setError('Please complete CAPTCHA first');
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
          <label>CAPTCHA:</label>
          {recaptchaSiteKey ? (
            <div className="captcha-shell">
              <ReCAPTCHA
                sitekey={recaptchaSiteKey}
                onChange={(value) => setCaptchaToken(value || '')}
                onExpired={() => setCaptchaToken('')}
              />
            </div>
          ) : (
            <div className="auth-alert auth-alert-warning">
              Missing VITE_RECAPTCHA_SITE_KEY in frontend env.
            </div>
          )}
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
