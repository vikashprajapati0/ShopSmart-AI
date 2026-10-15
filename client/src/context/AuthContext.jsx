import React, { createContext, useContext, useState, useEffect } from 'react';
import API from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('shopsmart_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('shopsmart_token'));
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const loadUser = async () => {
    const storedToken = localStorage.getItem('shopsmart_token');
    if (!storedToken) {
      setLoading(false);
      return;
    }

    try {
      const res = await API.get('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('shopsmart_user', JSON.stringify(res.data.user));
      }
    } catch {
      localStorage.removeItem('shopsmart_token');
      localStorage.removeItem('shopsmart_user');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();

    const handleLogoutEvent = () => {
      setUser(null);
      setToken(null);
      showToast('Session expired. Please log in again.', 'info');
    };

    window.addEventListener('auth-logout', handleLogoutEvent);
    return () => window.removeEventListener('auth-logout', handleLogoutEvent);
  }, []);

  const login = async (email, password) => {
    try {
      const res = await API.post('/auth/login', { email, password });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('shopsmart_token', newToken);
        localStorage.setItem('shopsmart_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        showToast(`Welcome back, ${newUser.name}!`, 'success');
        return { success: true, user: newUser };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to log in. Please check your credentials.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const register = async ({ name, email, password, phone }) => {
    try {
      const res = await API.post('/auth/register', { name, email, password, phone });
      if (res.data.success) {
        const { token: newToken, user: newUser } = res.data;
        localStorage.setItem('shopsmart_token', newToken);
        localStorage.setItem('shopsmart_user', JSON.stringify(newUser));
        setToken(newToken);
        setUser(newUser);
        showToast('Account created successfully!', 'success');
        return { success: true, user: newUser };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await API.post('/auth/logout');
    } catch (err) {
      // continue cleanup
    } finally {
      localStorage.removeItem('shopsmart_token');
      localStorage.removeItem('shopsmart_user');
      setUser(null);
      setToken(null);
      showToast('Logged out successfully.', 'info');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const res = await API.put('/auth/profile', profileData);
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem('shopsmart_user', JSON.stringify(res.data.user));
        showToast('Profile updated successfully.', 'success');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update profile.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const addAddress = async (address) => {
    try {
      const res = await API.post('/auth/addresses', address);
      if (res.data.success) {
        setUser((prev) => ({ ...prev, addresses: res.data.addresses }));
        showToast('Address added successfully.', 'success');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add address.';
      showToast(msg, 'error');
      return { success: false, message: msg };
    }
  };

  const deleteAddress = async (addressId) => {
    try {
      const res = await API.delete(`/auth/addresses/${addressId}`);
      if (res.data.success) {
        setUser((prev) => ({ ...prev, addresses: res.data.addresses }));
        showToast('Address removed.', 'info');
        return { success: true };
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete address.';
      showToast(msg, 'error');
      return { success: false };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        login,
        register,
        logout,
        updateProfile,
        addAddress,
        deleteAddress,
        refreshUser: loadUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
