import api, { API_ENDPOINTS } from '../constants/api';

export interface CreateRequestData {
  itemId: string;
  requestType: string;
  notes?: string;
}

export const requestService = {
  createRequest: async (data: CreateRequestData) => {
    return api.post('/api/mobile/requests', data);
  },
  
  getUserRequests: (params?: any) => api.get(API_ENDPOINTS.REQUESTS.LIST, { 
    params: { ...params, _t: Date.now() } // Add timestamp for cache busting
  }),
  
  cancelRequest: async (id: string) => {
    return api.delete(API_ENDPOINTS.REQUESTS.CANCEL(id));
  },
  
  cancelItemRequest: async (id: string) => {
    return api.delete(`/api/mobile/item-requests/${id}`);
  },
  
  submitAddItemRequest: async (data: any) => {
    return api.post('/api/mobile/add-item-request', data);
  },
  
  submitItemRequest: async (data: any) => {
    return api.post('/api/mobile/item-request', data);
  },
  
  getUserItemRequests: (params?: any) => api.get('/api/mobile/my-item-requests', { 
    params: { ...params, _t: Date.now() } // Add timestamp for cache busting
  }),
};