import axios from 'axios';
import { apiConfig, API_ENDPOINTS } from './apiConfig';
import { STORAGE_KEYS } from './index';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * API Client Configuration
 */
const api = axios.create(apiConfig);

// Request interceptor for adding auth token, CSRF token, and cache busting
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Add CSRF token for state-changing operations
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        const csrfToken = await AsyncStorage.getItem('csrf_token');
        if (csrfToken) {
          config.headers['X-CSRF-Token'] = csrfToken;
        }
      }
      
      // Add cache-busting headers
      config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
      config.headers['Pragma'] = 'no-cache';
      config.headers['Expires'] = '0';
      
    } catch (error) {
      console.error('Token retrieval error:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    console.error('API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message,
      code: error.code
    });
    
    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      console.error('Network connection failed - API server may be down');
    }
    
    // Handle authentication errors (but not for login endpoint)
    if (error.response?.status === 401 && !error.config?.url?.includes('/auth/login')) {
      // Clear auth data
      await AsyncStorage.removeItem(STORAGE_KEYS.TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      
      console.warn('Unauthorized access - redirecting to login');
    }
    
    return Promise.reject(error);
  }
);

export { API_ENDPOINTS };
export const API_BASE_URL = apiConfig.baseURL;
export default api;
