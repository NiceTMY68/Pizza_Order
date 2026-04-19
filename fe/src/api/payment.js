import apiClient from './client';

export const paymentAPI = {
  processPayment: async (orderId, paymentMethod) => {
    return await apiClient.post(`/payment/orders/${orderId}/pay`, {
      paymentMethod,
    });
  },

  createMomoQr: async (orderId) => {
    return await apiClient.post(`/payment/orders/${orderId}/momo/create`);
  },

  getMomoStatus: async (orderId) => {
    return await apiClient.get(`/payment/orders/${orderId}/momo/status`);
  },

  getInvoice: async (orderId) => {
    return await apiClient.get(`/payment/orders/${orderId}/invoice`);
  },
};

