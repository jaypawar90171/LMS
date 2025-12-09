import api, { API_ENDPOINTS } from '../constants/api';

interface ServiceSettings {
    extendedDays?: number;
    maxExtensions?: number;
    priorityLevel?: number;
    skipQueuePosition?: boolean;
}

interface AvailableService {
    _id: string;
    name: string;
    description: string;
    settings: ServiceSettings;
}

interface UserServiceDetail {
    _id: string;
    serviceId: AvailableService; 
    status: 'Active' | 'Suspended' | 'Expired';
    grantedDate: string;
    expiryDate: string | null;
    usageCount: number;
    maxUsage: number | null;
    currentUsage: number; 
}

export const serviceService = {
    getAvailableServices: async (token: string) => {
        const response = await api.get('/api/mobile/services', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.data as AvailableService[];
    },

    getUserServices: async (token: string) => {
        const response = await api.get('/api/mobile/services/my-services', {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data.data as UserServiceDetail[];
    },

    requestService: async (serviceId: string, token: string) => {
        const response = await api.post('/api/mobile/services/request', { serviceId }, {
            headers: { 
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data;
    },
};