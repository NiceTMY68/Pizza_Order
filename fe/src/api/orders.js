import apiClient from './client';

export const ordersAPI = {
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.tableId) params.append('tableId', filters.tableId);
    if (filters.status) params.append('status', filters.status);
    if (filters.supervisorId) params.append('supervisorId', filters.supervisorId);
    
    const query = params.toString();
    const endpoint = `/orders${query ? `?${query}` : ''}`;
    return await apiClient.get(endpoint);
  },

  getById: async (id) => {
    return await apiClient.get(`/orders/${id}`);
  },

  getByTable: async (tableId) => {
    return await apiClient.get(`/orders/table/${tableId}`);
  },

  create: async (tableId, notes = '') => {
    return await apiClient.post('/orders', { tableId, notes });
  },

  update: async (id, updates) => {
    return await apiClient.put(`/orders/${id}`, updates);
  },

  delete: async (id) => {
    return await apiClient.delete(`/orders/${id}`);
  },

  addItem: async (orderId, menuItemId, quantity, note = '') => {
    return await apiClient.post(`/orders/${orderId}/items`, {
      menuItemId,
      quantity,
      note,
    });
  },

  updateItem: async (orderId, itemId, updates) => {
    return await apiClient.put(`/orders/${orderId}/items/${itemId}`, updates);
  },

  deleteItem: async (orderId, itemId) => {
    return await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
  },
};
