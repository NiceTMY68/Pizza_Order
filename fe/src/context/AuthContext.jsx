import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const supervisorData = localStorage.getItem('supervisor');
    
    if (token && supervisorData) {
      try {
        setUser(JSON.parse(supervisorData));
      } catch (error) {
        localStorage.removeItem('token');
        localStorage.removeItem('supervisor');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      if (response && response.success) {
        setUser(response.data.supervisor);
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
    await authAPI.logout();
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
