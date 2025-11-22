import apiClient from './client';

export const reportsAPI = {
  getRevenue: async (startDate, endDate, groupBy = 'day') => {
    return await apiClient.get('/admin/reports/revenue', {
      params: { startDate, endDate, groupBy }
    });
  },

  getMenuItems: async (startDate, endDate, category, limit = 20) => {
    const params = { limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (category) params.category = category;
    return await apiClient.get('/admin/reports/menu-items', { params });
  },

  getSupervisors: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return await apiClient.get('/admin/reports/supervisors', { params });
  },

  getOperationalMetrics: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return await apiClient.get('/admin/reports/operational', { params });
  },

  getFinancialHealth: async (startDate, endDate) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return await apiClient.get('/admin/reports/financial', { params });
  }
};

