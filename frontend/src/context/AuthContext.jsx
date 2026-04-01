import React, { createContext, useState, useEffect, useRef } from 'react';
import api from '../api';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // When login/register directly provides a fresh profile, we skip re-fetching /auth/me
  const skipNextSyncRef = useRef(false);
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      return null;
    }
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncUser = async () => {
      if (!token) {
        setUser(null);
        localStorage.removeItem('user');
        setLoading(false);
        return;
      }

      // If login/register just set the token with a fresh profile, skip /auth/me
      if (skipNextSyncRef.current) {
        skipNextSyncRef.current = false;
        setLoading(false);
        return;
      }

      try {
        const res = await api.get('/auth/me');
        const profile = res.data?.user || null;
        setUser(profile);
        if (profile) {
          localStorage.setItem('user', JSON.stringify(profile));
        }
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    syncUser();
  }, [token]);

  const persistAuth = (authToken, profile) => {
    // Mark that the next token-change sync should be skipped — profile is already fresh
    skipNextSyncRef.current = true;
    localStorage.setItem('token', authToken);
    if (profile) {
      localStorage.setItem('user', JSON.stringify(profile));
    }
    setToken(authToken);
    setUser(profile || null);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data.token) {
      const profile = res.data.user || null;
      persistAuth(res.data.token, profile);
    }
    return res.data;
  };


  const sendOtp = async (email, captchaToken) => {
    const res = await api.post('/auth/send-otp', { email, captchaToken });
    return res.data;
  };

  const verifyOtpLogin = async (email, otp) => {
    const res = await api.post('/auth/verify-otp', { email, otp });
    const authToken = res.data?.data?.token;
    const profile = res.data?.data?.user || null;

    if (authToken) {
      persistAuth(authToken, profile);
    }

    return res.data;
  };

  const register = async (payload) => {
    const res = await api.post('/auth/register', payload);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        sendOtp,
        verifyOtpLogin,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
