import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api.js';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/business/profile').then((res) => {
        setUser(res.data);
      }).catch(() => {
        localStorage.removeItem('token');
      }).finally(() => {
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    try {
      const res = await api.post('/auth/login', { email, password });
      localStorage.setItem('token', res.data.token);
      setUser(res.data.business || res.data.user);
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  const register = async (email, password, confirmPassword) => {
    try {
      const res = await api.post('/auth/register', { email, password, confirmPassword });
      return { success: true, message: res.data.message || 'Регистрация успешна' };
    } catch (err) {
      console.error(err);
      return { success: false, error: err.response?.data?.error || 'Ошибка регистрации' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    navigate('/login');
  };

  const isAuthenticated = !!user && !loading;

  return { user, loading, isAuthenticated, login, logout, register };
};