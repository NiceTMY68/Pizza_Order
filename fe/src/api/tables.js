import apiClient from './client';

export const tablesAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.floor) params.append('floor', filters.floor);
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    
    const query = params.toString();
    const endpoint = `/tables${query ? `?${query}` : ''}`;
    return await apiClient.get(endpoint);
  },

  getByFloor: async (floor) => {
    return await apiClient.get(`/tables/floor/${floor}`);
  },

  getTakeaway: async () => {
    return await apiClient.get('/tables/takeaway');
  },

  getById: async (id) => {
    return await apiClient.get(`/tables/${id}`);
  },

  getStatus: async (id) => {
    return await apiClient.get(`/tables/${id}/status`);
  },

  updateStatus: async (id, status, currentOrderId = null) => {
    return await apiClient.put(`/tables/${id}/status`, {
      status,
      currentOrderId,
    });
  },
};

