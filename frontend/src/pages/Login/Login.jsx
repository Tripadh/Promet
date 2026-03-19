import '../../components/auth/Auth.css';
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import LoginForm from '../../components/auth/LoginForm';
import OtpLoginForm from '../../components/auth/OtpLoginForm';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const { token, loading, googleLogin } = useAuth();
  const [authMode, setAuthMode] = useState('password');
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && token) {
      navigate('/dashboard');
    }
  }, [token, loading, navigate]);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h1 style={{ color: 'white', textAlign: 'center' }}>Login to AI Improver</h1>
        <div className="auth-mode-switch">
          <button
            type="button"
            className={authMode === 'password' ? 'active' : ''}
            onClick={() => setAuthMode('password')}
          >
            Password
          </button>
          <button
            type="button"
            className={authMode === 'otp' ? 'active' : ''}
            onClick={() => setAuthMode('otp')}
          >
            OTP
          </button>
        </div>

        {authMode === 'password' ? <LoginForm /> : <OtpLoginForm />}

        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', marginBottom: '20px' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await googleLogin(credentialResponse.credential);
                navigate('/dashboard');
              } catch (error) {
                console.error("Google login failed via backend:", error);
              }
            }}
            onError={() => {
              console.log("Login Failed at Google Popup");
            }}
            theme="filled_black"
          />
        </div>
        <p style={{ textAlign: 'center', color: '#ECECEC' }}>
          Don't have an account? <Link to="/register" style={{ color: '#10a37f' }}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
