import apiClient from './client';

export const ordersAPI = {
  getAll: async (params) => {
    return await apiClient.get('/admin/orders', { params });
  },

  getById: async (id) => {
    return await apiClient.get(`/admin/orders/${id}`);
  },

  cancel: async (id) => {
    return await apiClient.put(`/admin/orders/${id}/cancel`);
  }
};

