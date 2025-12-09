import api, { API_ENDPOINTS } from '../constants/api';

/**
 * Notifications API Service
 */
export const notificationService = {
  getNotifications: () => api.get(API_ENDPOINTS.NOTIFICATIONS.LIST),
  markAsRead: (id: string) => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id)),
  markAllAsRead: () => api.post(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ),
  deleteNotification: (id: string) => api.delete(API_ENDPOINTS.NOTIFICATIONS.DELETE(id)),
  updateSettings: (settings: any) => api.put(API_ENDPOINTS.NOTIFICATIONS.SETTINGS, settings),
  getSettings: () => api.get(API_ENDPOINTS.NOTIFICATIONS.SETTINGS),
  createNotification: (data: any) => api.post('/api/mobile/notifications', data),
};