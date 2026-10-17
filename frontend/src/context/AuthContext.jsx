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
          console.warn('Stored token invalid. Logging out.');
          localStorage.removeItem('agentic_ats_token');
          setUser(null);
        }
      } else {
        // Auto-authenticate with demo user on initial visit if desired, or allow sign in
        try {
          const data = await api.login('demo@agenticats.com', 'Password123!');
          localStorage.setItem('agentic_ats_token', data.access_token);
          setUser(data.user);
        } catch (err) {
          setUser(null);
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const loginDemoUser = async () => {
    const data = await api.login('demo@agenticats.com', 'Password123!');
    localStorage.setItem('agentic_ats_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem('agentic_ats_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const register = async (email, password, fullName) => {
    const data = await api.register(email, password, fullName);
    localStorage.setItem('agentic_ats_token', data.access_token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('agentic_ats_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, loginDemoUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
