import { apiConfig } from '@/constants/apiConfig';

interface EndpointTest {
  name: string;
  endpoint: string;
  method: 'GET' | 'POST';
  requiresAuth: boolean;
}

const endpoints: EndpointTest[] = [
  // Auth endpoints
  { name: 'Login', endpoint: '/api/mobile/auth/login', method: 'POST', requiresAuth: false },
  { name: 'Signup', endpoint: '/api/mobile/auth/signup', method: 'POST', requiresAuth: false },
  { name: 'Logout', endpoint: '/api/mobile/auth/logout', method: 'POST', requiresAuth: true },
  { name: 'Profile', endpoint: '/api/mobile/profile', method: 'GET', requiresAuth: true },
  { name: 'Change Password', endpoint: '/api/mobile/auth/change-password', method: 'POST', requiresAuth: true },
  { name: 'Forgot Password', endpoint: '/api/mobile/auth/forgot-password', method: 'POST', requiresAuth: false },
  
  // Dashboard
  { name: 'Dashboard', endpoint: '/api/mobile/dashboard', method: 'GET', requiresAuth: true },
  
  // Items
  { name: 'Items List', endpoint: '/api/mobile/items', method: 'GET', requiresAuth: true },
  { name: 'New Arrivals', endpoint: '/api/mobile/items/new-arrivals', method: 'GET', requiresAuth: true },
  { name: 'Search Items', endpoint: '/api/mobile/items/search?q=test', method: 'GET', requiresAuth: true },
  
  // Categories
  { name: 'Categories', endpoint: '/api/mobile/categories', method: 'GET', requiresAuth: true },
  
  // Requests
  { name: 'User Requests', endpoint: '/api/mobile/requests', method: 'GET', requiresAuth: true },
  { name: 'Item Requests', endpoint: '/api/mobile/my-item-requests', method: 'GET', requiresAuth: true },
  { name: 'Add Item Request', endpoint: '/api/mobile/add-item-request', method: 'POST', requiresAuth: true },
  
  // Transactions
  { name: 'Transactions', endpoint: '/api/mobile/transactions', method: 'GET', requiresAuth: true },
  { name: 'Renewal Requests', endpoint: '/api/mobile/renewal-requests', method: 'GET', requiresAuth: true },
  
  // Notifications
  { name: 'Notifications', endpoint: '/api/mobile/notifications', method: 'GET', requiresAuth: true },
  { name: 'Notification Settings', endpoint: '/api/mobile/notifications/settings', method: 'GET', requiresAuth: true },
  
  // Fines
  { name: 'Fines', endpoint: '/api/mobile/fines', method: 'GET', requiresAuth: true },
  
  // Donations
  { name: 'Donations', endpoint: '/api/mobile/donations', method: 'GET', requiresAuth: true },
  
  // File Upload
  { name: 'Upload Image', endpoint: '/api/mobile/upload/image', method: 'POST', requiresAuth: true },
];

export const testAPIEndpoints = async (token?: string) => {
  console.log('🔍 Starting API Health Check...');
  console.log('Base URL:', apiConfig.baseURL);
  
  const results: { [key: string]: { status: number | string; available: boolean; error?: string } } = {};
  
  for (const endpoint of endpoints) {
    try {
      const headers: any = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      if (endpoint.requiresAuth && token) {
        headers.Authorization = `Bearer ${token}`;
      }
      
      const response = await fetch(`${apiConfig.baseURL}${endpoint.endpoint}`, {
        method: endpoint.method,
        headers,
      });
      
      results[endpoint.name] = {
        status: response.status,
        available: response.status < 500, // 404 means endpoint exists but resource not found
      };
      
      console.log(`✅ ${endpoint.name}: ${response.status}`);
    } catch (error: any) {
      results[endpoint.name] = {
        status: 'ERROR',
        available: false,
        error: error.message,
      };
      console.log(`❌ ${endpoint.name}: ${error.message}`);
    }
  }
  
  return results;
};

export const getWorkingEndpoints = (results: any) => {
  return Object.entries(results)
    .filter(([_, result]: [string, any]) => result.available)
    .map(([name]) => name);
};

export const getMissingEndpoints = (results: any) => {
  return Object.entries(results)
    .filter(([_, result]: [string, any]) => !result.available)
    .map(([name]) => name);
};