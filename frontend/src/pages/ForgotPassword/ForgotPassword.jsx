import React, { useState } from 'react';
import api from '../../api';
import { Link, useNavigate } from 'react-router-dom';
import '../../components/auth/Auth.css';
import logo from '../../assets/logo.png';
import LightRays from '../../components/ui/LightRays';

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [status, setStatus] = useState(null);
  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/forgot-password', { email });
      const data = response.data;
      if (response.status === 200) {
        setStatus({ type: 'success', message: 'Recovery code sent to your email.' });
        setStep(2);
      } else {
        setStatus({ type: 'error', message: data.message || 'Error sending recovery code.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/auth/reset-password', { email, otp, newPassword });
      const data = response.data;
      if (response.status === 200) {
        setStatus({ type: 'success', message: 'Password reset successfully! Redirecting...' });
        setTimeout(() => navigate('/login'), 2500);
      } else {
        setStatus({ type: 'error', message: data.message || 'Error resetting password.' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Network error occurred.' });
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-rays-wrap" aria-hidden="true">
        <LightRays
          raysOrigin="top-center"
          raysColor="#ffffff"
          raysSpeed={1.5}
          lightSpread={0.65}
          rayLength={2.5}
          followMouse={true}
          mouseInfluence={0.15}
          noiseAmount={0}
          distortion={0}
          pulsating={false}
          fadeDistance={1}
          saturation={1}
        />
      </div>
      <div className="auth-form">
        <div style={{ textAlign: 'center', marginBottom: '4px' }}>
          <div style={{ marginBottom: '16px' }}>
            <img src={logo} alt="Promet Logo" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
          </div>
          <h1 style={{ margin: 0 }}>Promet</h1>
          <p style={{ margin: '4px 0 0 0', fontWeight: 'bold', color: '#fff' }}>Reset Password</p>
        </div>
        <p style={{ textAlign: 'center', marginBottom: '16px' }}>
          {step === 1 
            ? "Enter your email address to receive a recovery code." 
            : "Enter the code sent to your email and your new password."}
        </p>

        {status && (
          <div className={`auth-alert auth-alert-${status.type}`}>
            {status.message}
          </div>
        )}

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="auth-field" style={{ gap: '16px' }}>
            <div className="auth-field">
              <label>Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
              />
            </div>
            <button type="submit">Send Recovery Code</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="auth-field" style={{ gap: '16px' }}>
            <div className="auth-field">
              <label>Recovery Code (OTP)</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit code"
                required
              />
            </div>
            <div className="auth-field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new secure password"
                required
              />
            </div>
            <button type="submit">Complete Reset</button>
          </form>
        )}

        <p style={{ textAlign: 'center', marginTop: '16px' }}>
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
