import api from '../constants/api';

/**
 * CSRF Token Service
 */
export const csrfService = {
  async getCSRFToken() {
    try {
      const response = await api.get('/api/csrf-token');
      return response.data.csrfToken;
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
      return null;
    }
  }
};