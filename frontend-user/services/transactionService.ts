import api, { API_ENDPOINTS } from '../constants/api';

/**
 * Transactions API Service
 */
export const transactionService = {
  getUserTransactions: () => api.get(API_ENDPOINTS.TRANSACTIONS.LIST),
  renewItem: (id: string) => api.post(API_ENDPOINTS.TRANSACTIONS.RENEW(id)),
  requestRenewal: (transactionId: string, data: any) => api.post(`/api/mobile/transactions/${transactionId}/renew`, data),
  getRenewalRequests: () => api.get('/api/mobile/renewal-requests'),
};