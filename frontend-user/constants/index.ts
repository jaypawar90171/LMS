import { getCurrentConfig } from './environment';

const envConfig = getCurrentConfig();

// API Constants
export const API_CONFIG = {
  BASE_URL: envConfig.API_BASE_URL,
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
};

// Storage Keys
export const STORAGE_KEYS = {
  TOKEN: process.env.EXPO_PUBLIC_STORAGE_TOKEN_KEY || 'auth_token',
  USER: process.env.EXPO_PUBLIC_STORAGE_USER_KEY || 'user_data',
  THEME: process.env.EXPO_PUBLIC_STORAGE_THEME_KEY || 'app_theme',
  LANGUAGE: process.env.EXPO_PUBLIC_STORAGE_LANGUAGE_KEY || 'app_language',
};

// Screen Names
export const SCREENS = {
  LOGIN: 'Login',
  HOME: 'Home',
  SEARCH: 'Search',
  REQUESTS: 'Requests',
  PROFILE: 'Profile',
  LOADING: 'Loading',
};

// Request Status
export const REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  FULFILLED: 'fulfilled',
  CANCELLED: 'cancelled',
};

// Transaction Status
export const TRANSACTION_STATUS = {
  ACTIVE: 'active',
  RETURNED: 'returned',
  OVERDUE: 'overdue',
};

// Colors
export const COLORS = {
  PRIMARY: '#007AFF',
  SUCCESS: '#28a745',
  DANGER: '#dc3545',
  WARNING: '#ffc107',
  INFO: '#17a2b8',
  LIGHT: '#f8f9fa',
  DARK: '#343a40',
  WHITE: '#ffffff',
  GRAY: '#6c757d',
  BACKGROUND: '#f5f5f5',
};

// Dimensions
export const DIMENSIONS = {
  PADDING: 15,
  MARGIN: 10,
  BORDER_RADIUS: 8,
  HEADER_HEIGHT: 60,
};

// Validation Rules
export const VALIDATION = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_PASSWORD_LENGTH: 6,
  MAX_SEARCH_LENGTH: 100,
};