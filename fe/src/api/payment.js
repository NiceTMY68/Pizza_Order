import apiClient from './client';

export const paymentAPI = {
  processPayment: async (orderId, paymentMethod) => {
    return await apiClient.post(`/payment/orders/${orderId}/pay`, {
      paymentMethod,
    });
  },

  getInvoice: async (orderId) => {
    return await apiClient.get(`/payment/orders/${orderId}/invoice`);
  },
};

