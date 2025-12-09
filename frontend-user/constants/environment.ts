// Environment configuration for local development
const LOCAL_API_BASE_URL = 'http://192.168.31.217:5000';
const REMOTE_API_BASE_URL = 'http://68.178.165.24:8022/librarymanagementapi';

export const ENV_CONFIG = {
  development: {
    API_BASE_URL: LOCAL_API_BASE_URL,
    TIMEOUT: 30000,
    WS_BASE_URL: 'http://192.168.31.217:5000',
    DEBUG: true,
  },
  production: {
    API_BASE_URL: REMOTE_API_BASE_URL,
    TIMEOUT: 30000,
    WS_BASE_URL: 'ws://68.178.165.24:8022',
    DEBUG: false,
  }
};

// Temporarily use production for testing
export const getCurrentConfig = () => {
  return ENV_CONFIG.development; // Switch back to development once local works
};
