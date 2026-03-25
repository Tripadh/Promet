import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ReCAPTCHA from 'react-google-recaptcha';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [captchaToken, setCaptchaToken] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!captchaToken) {
      setError('Please complete the CAPTCHA check');
      return;
    }

    try {
      await register({
        name,
        email,
        password,
        captchaToken,
      });

      await login(email, password);
      setSuccessMessage('Registration successful. Redirecting to dashboard...');
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-register-form">
      {error && <div className="auth-alert auth-alert-error">{error}</div>}
      {successMessage && <div className="auth-alert auth-alert-success">{successMessage}</div>}
      <div className="auth-field">
        <label>Name:</label>
        <input 
          type="text" 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          required 
        />
      </div>
      <div className="auth-field">
        <label>Email:</label>
        <input 
          type="email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
        />
      </div>
      <div className="auth-field">
        <label>Password:</label>
        <div className="password-input-wrapper">
          <input 
            type={showPassword ? "text" : "password"} 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button 
            type="button" 
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
            )}
          </button>
        </div>
      </div>
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

      <div className="auth-field" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '12px', marginTop: '4px', marginBottom: '16px' }}>
        <input 
          type="checkbox" 
          id="termsAgree" 
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
          required
          style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: '#10a37f' }}
        />
        <label htmlFor="termsAgree" style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#a1a1aa', fontWeight: '400' }}>
          I agree to the <Link to="/terms" style={{ color: '#fff', fontWeight: '500', textDecoration: 'none' }} target="_blank">Terms of Service</Link>, <Link to="/privacy" style={{ color: '#fff', fontWeight: '500', textDecoration: 'none' }} target="_blank">Privacy Policy</Link>, <Link to="/acceptable-use" style={{ color: '#fff', fontWeight: '500', textDecoration: 'none' }} target="_blank">Acceptable Use Policy</Link>, and I confirm that all the details I have provided are correct and accurate.
        </label>
      </div>

      <button type="submit">Register</button>
    </form>
  );
};

export default RegisterForm;
