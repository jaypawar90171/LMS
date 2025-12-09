import api, { API_ENDPOINTS } from '../constants/api';
import { STORAGE_KEYS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  employeeId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ForgotPasswordData {
  email: string;
}

export interface ResetPasswordData {
  token: string;
  password: string;
}

/**
 * Authentication API Service
 */
export const authService = {
  async login(credentials: LoginCredentials) {
    return api.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
  },

  async register(userData: RegisterData) {
    return api.post(API_ENDPOINTS.AUTH.REGISTER, userData);
  },

  async logout() {
    return api.post(API_ENDPOINTS.AUTH.LOGOUT);
  },

  async getProfile() {
    return api.get(API_ENDPOINTS.AUTH.PROFILE);
  },

  async refreshToken() {
    return api.post(API_ENDPOINTS.AUTH.REFRESH);
  },

  async updateProfile(data: any) {
    return api.put(API_ENDPOINTS.AUTH.UPDATE_PROFILE, data);
  },

  async changePassword(data: ChangePasswordData) {
    // Check if we have a token
    const token = await AsyncStorage.getItem(STORAGE_KEYS.TOKEN);
    
    const response = await api.post('/api/mobile/auth/change-password', data);
    return response;
  },

  async forgotPassword(data: ForgotPasswordData) {
    return api.post('/api/mobile/auth/forgot-password', data);
  },

  async resetPassword(data: ResetPasswordData) {
    return api.post('/api/mobile/auth/reset-password', data);
  }
};