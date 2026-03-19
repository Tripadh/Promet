import '../../components/auth/Auth.css';
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
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
        <h1 style={{ color: 'white', textAlign: 'center' }}>Register</h1>
        <RegisterForm />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
          <GoogleLogin
            onSuccess={async (credentialResponse) => {
              try {
                await googleLogin(credentialResponse.credential);
                navigate('/dashboard');
              } catch (error) {
                console.error('Google register/login failed via backend:', error);
              }
            }}
            onError={() => {
              console.log('Google Register Failed at Popup');
            }}
            theme="filled_black"
          />
        </div>
        <p style={{ textAlign: 'center', color: '#ECECEC' }}>
          Already have an account? <Link to="/login" style={{ color: '#10a37f' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
