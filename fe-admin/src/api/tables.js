import apiClient from './client';

export const tablesAPI = {
  getAll: async (floor, type, status, search) => {
    const params = {};
    if (floor) params.floor = floor;
    if (type) params.type = type;
    if (status) params.status = status;
    if (search) params.search = search;
    return await apiClient.get('/admin/tables', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/admin/tables/${id}`);
  },

  create: async (data) => {
    return await apiClient.post('/admin/tables', data);
  },

  update: async (id, data) => {
    return await apiClient.put(`/admin/tables/${id}`, data);
  },

  delete: async (id) => {
    return await apiClient.delete(`/admin/tables/${id}`);
  }
};

