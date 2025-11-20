import apiClient from './client';

export const kitchenAPI = {
  getPending: () => apiClient.get('/kitchen/pending'),
  markReady: (orderId, itemId) =>
    apiClient.patch(`/kitchen/orders/${orderId}/items/${itemId}/status`, { status: 'ready' }),
  decline: (orderId, itemId) =>
    apiClient.patch(`/kitchen/orders/${orderId}/items/${itemId}/status`, { status: 'declined' })
};

