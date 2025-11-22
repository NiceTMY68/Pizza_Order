import apiClient from './client';

export const menuAPI = {
  getAll: async (category, search) => {
    const params = {};
    if (category) params.category = category;
    if (search) params.search = search;
    return await apiClient.get('/admin/menu', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/admin/menu/${id}`);
  },

  create: async (data) => {
    return await apiClient.post('/admin/menu', data);
  },

  update: async (id, data) => {
    return await apiClient.put(`/admin/menu/${id}`, data);
  },

  delete: async (id) => {
    return await apiClient.delete(`/admin/menu/${id}`);
  }
};

