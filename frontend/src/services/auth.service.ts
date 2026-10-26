import { request } from './api';
import { User } from '../types';

export interface AuthResponse {
  token: string;
  user: User;
  previewCode?: string;
  message?: string;
}

export interface DbStatusResponse {
  isConnected: boolean;
  dbError: string | null;
  readyState: number;
  databaseName: string;
}

export const authApiService = {
  getDbStatus(): Promise<DbStatusResponse> {
    return request<DbStatusResponse>('/api/auth/db-status');
  },

  getMe(): Promise<User> {
    return request<User>('/api/auth/me');
  },

  login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  },

  register(userData: {
    name: string;
    email: string;
    password: string;
    preferredCurrency?: string;
  }): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  sendVerification(email?: string): Promise<{ success: boolean; message: string; previewCode?: string }> {
    return request('/api/auth/send-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyEmail(email: string, code: string): Promise<{ success: boolean; message: string; user: User }> {
    return request('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  forgotPassword(email: string): Promise<{ success: boolean; message: string; previewCode?: string }> {
    return request('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  resetPassword(payload: {
    email: string;
    code: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string; token: string; user: User }> {
    return request('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  sendOtpLogin(email: string): Promise<{ success: boolean; message: string; previewCode?: string }> {
    return request('/api/auth/send-otp-login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyOtpLogin(email: string, code: string): Promise<{ success: boolean; token: string; user: User }> {
    return request('/api/auth/verify-otp-login', {
      method: 'POST',
      body: JSON.stringify({ email, code }),
    });
  },

  demoLogin(): Promise<AuthResponse> {
    return request<AuthResponse>('/api/auth/demo', {
      method: 'POST',
    });
  },

  updateProfile(profileData: {
    name?: string;
    jobTitle?: string;
    preferredCurrency?: string;
    monthlyIncomeTarget?: number;
    alertThresholdPercent?: number;
  }): Promise<User> {
    return request<User>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};
