import '../../components/auth/Auth.css';
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import LoginForm from '../../components/auth/LoginForm';
import { useAuth } from '../../hooks/useAuth';

const Login = () => {
  const { token, loading, googleLogin } = useAuth();
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
