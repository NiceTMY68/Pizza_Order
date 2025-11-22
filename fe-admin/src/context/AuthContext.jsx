import { createContext, useContext, useState, useEffect } from 'react';
import { adminAuthAPI } from '../api/adminAuth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    const adminData = localStorage.getItem('admin');
    
    if (token && adminData) {
      try {
        setUser(JSON.parse(adminData));
      } catch (error) {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await adminAuthAPI.login(username, password);
      if (response && response.success) {
        setUser(response.data.admin);
        return { success: true };
      }
      return { success: false, message: (response && response.message) || 'Login failed' };
    } catch (error) {
      const errorMessage = error.message || (error.response && error.response.message) || 'Login failed';
      return { 
        success: false, 
        message: errorMessage
      };
    }
  };

  const logout = async () => {
    await adminAuthAPI.logout();
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

