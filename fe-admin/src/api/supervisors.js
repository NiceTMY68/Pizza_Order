import apiClient from './client';

export const supervisorsAPI = {
  getAll: async (search, isActive) => {
    const params = {};
    if (search) params.search = search;
    if (isActive !== undefined) params.isActive = isActive;
    return await apiClient.get('/admin/supervisors', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/admin/supervisors/${id}`);
  },

  create: async (data) => {
    return await apiClient.post('/admin/supervisors', data);
  },

  update: async (id, data) => {
    return await apiClient.put(`/admin/supervisors/${id}`, data);
  },

  delete: async (id) => {
    return await apiClient.delete(`/admin/supervisors/${id}`);
  }
};

