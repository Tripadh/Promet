import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';

const OAuthSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { token, user, login } = useAuth(); // We'll need a way to set token directly from context

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlToken = params.get('token');
    const error = params.get('error');

    if (error) {
      navigate(`/login?error=${error}`);
      return;
    }

    if (urlToken) {
      // Persist the token in localStorage
      localStorage.setItem('token', urlToken);
      
      // Give the AuthContext time to re-sync using the new token or reload the app
      window.location.href = '/dashboard';
    } else {
      navigate('/login');
    }
  }, [location, navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--color-bg)',
      color: 'white',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <h2>Authenticating via GitHub...</h2>
      <p>Securely redirecting you to your dashboard.</p>
    </div>
  );
};

export default OAuthSuccess;
