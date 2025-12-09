import api, { API_ENDPOINTS } from '../constants/api';

export const fineService = {
  async getFines() {
    return api.get('/api/mobile/fines');
  }
};