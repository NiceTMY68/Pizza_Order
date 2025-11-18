import apiClient from './client';

export const menuAPI = {
  getAll: async (category = null, available = null) => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (available !== null) params.append('available', available);
    
    const query = params.toString();
    const endpoint = `/menu${query ? `?${query}` : ''}`;
    return await apiClient.get(endpoint);
  },

  getDrinks: async () => {
    return await apiClient.get('/menu/drinks');
  },

  getPizzas: async () => {
    return await apiClient.get('/menu/pizzas');
  },

  getPastas: async () => {
    return await apiClient.get('/menu/pastas');
  },

  getById: async (id) => {
    return await apiClient.get(`/menu/items/${id}`);
  },
};

