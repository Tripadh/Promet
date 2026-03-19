import '../../components/auth/Auth.css';
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../hooks/useAuth';

const Register = () => {
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
        <h1 style={{ color: 'white', textAlign: 'center' }}>Register</h1>
        <RegisterForm />
        <p style={{ textAlign: 'center', color: '#ECECEC' }}>
          Already have an account? <Link to="/login" style={{ color: '#10a37f' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
