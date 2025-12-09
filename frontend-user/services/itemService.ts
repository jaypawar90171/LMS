import api, { API_ENDPOINTS } from '../constants/api';

export interface ItemSearchParams {
  q?: string;
  category?: string;
  page?: number;
  limit?: number;
}

/**
 * Items API Service
 */
export const itemService = {
  getItems: (params: ItemSearchParams = {}) => api.get(API_ENDPOINTS.ITEMS.LIST, { params }),
  getNewArrivals: (params: ItemSearchParams = {}) => api.get(API_ENDPOINTS.ITEMS.NEW_ARRIVALS, { params }),
  searchItems: (query: string) => {
    if (!query || query.trim() === '') {
      return Promise.resolve({ data: { data: [] } });
    }
    return api.get(API_ENDPOINTS.ITEMS.SEARCH, { params: { q: query } });
  },
  getItemDetails: (id: string) => api.get(API_ENDPOINTS.ITEMS.DETAILS(id)),
  requestItem: (id: string, data: any) => api.post(API_ENDPOINTS.ITEMS.REQUEST(id), data),
};