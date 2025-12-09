import { API_CONFIG } from './index';

/**
 * API Configuration
 */
export const apiConfig = {
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/api/mobile/auth/login',
    REGISTER: '/api/mobile/auth/signup',
    LOGOUT: '/api/mobile/auth/logout',
    REFRESH: '/api/mobile/auth/refresh',
    PROFILE: '/api/mobile/profile',
    UPDATE_PROFILE: '/api/mobile/profile',
  },
  
  // Categories
  CATEGORIES: {
    LIST: '/api/mobile/categories',
    DETAILS: (id: string) => `/api/mobile/categories/${id}`,
  },
  
  // Items
  ITEMS: {
    LIST: '/api/mobile/items',
    SEARCH: '/api/mobile/items/search',
    NEW_ARRIVALS: '/api/mobile/items/new-arrivals',
    DETAILS: (id: string) => `/api/mobile/items/${id}`,
    REQUEST: (id: string) => `/api/mobile/items/${id}/request`,
  },
  
  // Requests
  REQUESTS: {
    LIST: '/api/mobile/requests',
    CREATE: '/api/mobile/requests',
    CANCEL: (id: string) => `/api/mobile/requests/${id}`,
  },
  
  // Transactions
  TRANSACTIONS: {
    LIST: '/api/mobile/transactions',
    RENEW: (id: string) => `/api/mobile/transactions/${id}/renew`,
  },
  
  // Fines
  FINES: {
    LIST: '/api/mobile/fines',
    PAY: (id: string) => `/api/mobile/fines/${id}/pay`,
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/api/mobile/notifications',
    MARK_READ: (id: string) => `/api/mobile/notifications/${id}/read`,
    MARK_ALL_READ: '/api/mobile/notifications/mark-all-read',
    DELETE: (id: string) => `/api/mobile/notifications/${id}`,
    SETTINGS: '/api/mobile/notifications/settings',
  },
  
  // Donations
  DONATIONS: {
    LIST: '/api/mobile/donations',
    CREATE: '/api/mobile/donations',
  },
};