import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('agentic_ats_token');
      if (token) {
        try {
          const userData = await api.getMe();
          setUser(userData);
        } catch (err) {
          console.warn('Stored token invalid. Auto-authenticating with demo user.');
          await loginDemoUser();
        }
      } else {
        await loginDemoUser();
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginDemoUser = async () => {
    try {
      const data = await api.login('demo@agenticats.com', 'Password123!');
      localStorage.setItem('agentic_ats_token', data.access_token);
      setUser(data.user);
    } catch (err) {
      // If demo user not yet created, register it
      try {
        const regData = await api.register('demo@agenticats.com', 'Password123!', 'Alexandre Demo');
        localStorage.setItem('agentic_ats_token', regData.access_token);
        setUser(regData.user);
      } catch (e) {
        console.error('Demo auth setup error:', e);
      }
    }
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('agentic_ats_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('agentic_ats_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, loginDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
