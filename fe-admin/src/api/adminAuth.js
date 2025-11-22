import apiClient from './client';

export const adminAuthAPI = {
  login: async (username, password) => {
    const response = await apiClient.post('/admin/auth/login', { username, password });
    if (response.success && response.data) {
      localStorage.setItem('adminToken', response.data.token);
      localStorage.setItem('admin', JSON.stringify(response.data.admin));
    }
    return response;
  },

  logout: async () => {
    await apiClient.post('/admin/auth/logout');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('admin');
  },

  getMe: async () => {
    return await apiClient.get('/admin/auth/me');
  }
};

