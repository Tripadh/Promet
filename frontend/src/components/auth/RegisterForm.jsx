import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ReCAPTCHA from 'react-google-recaptcha';

const RegisterForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        <input 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
        />
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
