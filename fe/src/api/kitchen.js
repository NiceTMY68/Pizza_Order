import apiClient from './client';

export const kitchenAPI = {
  sendToKitchen: async (orderId) => {
    return await apiClient.post(`/kitchen/orders/${orderId}/send-to-kitchen`);
  },

  getKitchenStatus: async (orderId) => {
    return await apiClient.get(`/kitchen/orders/${orderId}/kitchen-status`);
  },

  getPending: async () => {
    return await apiClient.get('/kitchen/pending');
  },

  updateItemStatus: async (orderId, itemId, status) => {
    return await apiClient.patch(`/kitchen/orders/${orderId}/items/${itemId}/status`, { status });
  }
};

