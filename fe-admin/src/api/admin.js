import apiClient from './client';

export const adminAPI = {
  getDashboard: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return await apiClient.get('/admin/dashboard', { params });
  }
};

