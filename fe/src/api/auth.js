import apiClient from './client';

export const authAPI = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    if (response.success) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('supervisor', JSON.stringify(response.data.supervisor));
    }
    return response;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('supervisor');
    }
  },

  getMe: async () => {
    return await apiClient.get('/auth/me');
  },
};

