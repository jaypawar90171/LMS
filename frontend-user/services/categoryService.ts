import api, { API_ENDPOINTS } from '../constants/api';

/**
 * Categories API Service
 */
export const categoryService = {
  getCategories: () => api.get(API_ENDPOINTS.CATEGORIES.LIST),
  getCategoryDetails: (id: string) => api.get(API_ENDPOINTS.CATEGORIES.DETAILS(id)),
};