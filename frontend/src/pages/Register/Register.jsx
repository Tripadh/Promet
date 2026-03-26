import '../../components/auth/Auth.css';
import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';
import { useAuth } from '../../hooks/useAuth';
import LightRays from '../../components/ui/LightRays';
import logo from '../../assets/logo.png';
import { API_BASE_URL } from '../../api';

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
        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ marginBottom: '16px' }}>
            <img src={logo} alt="Promet Logo" style={{ width: '48px', height: '48px', borderRadius: '12px' }} />
          </div>
          <h1 style={{ margin: 0 }}>Promet</h1>
          <p style={{ margin: '4px 0 0 0' }}>Create a new account</p>
        </div>
        <RegisterForm />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '12px' }}>
        <div className="auth-actions">
          <a
            href={`${API_BASE_URL}/auth/github`}
            className="btn-secondary"
          >
            <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" />
            </svg>
            Sign up with GitHub
          </a>
        </div>
        </div>
        <p style={{ textAlign: 'center', color: '#ECECEC' }}>
          Already have an account? <Link to="/login" style={{ color: '#10a37f' }}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
