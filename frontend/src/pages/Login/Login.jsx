import '../../components/auth/Auth.css';
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const { token, loading } = useAuth();
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
        <LoginForm />
        <p style={{ textAlign: 'center', color: '#ECECEC' }}>
          Don't have an account? <a href="/register" style={{ color: '#10a37f' }}>Register</a>
        </p>
      </div>
    </div>
  );
};

export default Login;
