import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { authApiService } from '../services/auth.service';
import { STORAGE_KEYS } from '../constants';

interface DbStatusInfo {
  isConnected: boolean;
  dbError: string | null;
  databaseName?: string;
}

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  dbStatus: DbStatusInfo;
  checkDbStatus: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, preferredCurrency: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  sendVerificationCode: (email?: string) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number; error?: string }>;
  verifyEmail: (code: string, email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number; error?: string }>;
  submitPasswordReset: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  sendOtpLogin: (email: string) => Promise<{ success: boolean; message?: string; cooldownSeconds?: number; error?: string }>;
  verifyOtpLogin: (email: string, code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) || null;
    } catch {
      return null;
    }
  });

  const [dbStatus, setDbStatus] = useState<DbStatusInfo>({
    isConnected: false,
    dbError: null,
  });

  const checkDbStatus = async () => {
    try {
      const data = await authApiService.getDbStatus();
      setDbStatus(data);
    } catch {
      // Backend starting or offline
    }
  };

  useEffect(() => {
    checkDbStatus();
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_USER);
      }

      if (token) {
        localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      } else {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
    } catch (e) {
      console.error('Failed to sync auth state', e);
    }
  }, [currentUser, token]);

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const data = await authApiService.getMe();
      setCurrentUser(data);
    } catch {}
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const data = await authApiService.login({ email: cleanEmail, password });
      setCurrentUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Login failed. Please check credentials.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    preferredCurrency: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      const data = await authApiService.register({
        name: cleanName,
        email: cleanEmail,
        password,
        preferredCurrency: preferredCurrency || 'USD',
      });

      setCurrentUser(data.user);
      setToken(data.token);

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    }
  };

  const sendVerificationCode = async (
    targetEmail?: string
  ): Promise<{ success: boolean; message?: string; cooldownSeconds?: number; error?: string }> => {
    const emailToUse = targetEmail || currentUser?.email;
    if (!emailToUse) {
      return { success: false, error: 'No email address provided.' };
    }

    try {
      const data = await authApiService.sendVerification(emailToUse);
      return {
        success: true,
        message: data.message,
        cooldownSeconds: data.cooldownSeconds,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send verification code.' };
    }
  };

  const verifyEmail = async (
    code: string,
    targetEmail?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const emailToUse = targetEmail || currentUser?.email;
    if (!emailToUse) {
      return { success: false, error: 'Email address is required.' };
    }

    try {
      const data = await authApiService.verifyEmail(emailToUse, code);

      if (data.user && currentUser && currentUser.email === data.user.email) {
        setCurrentUser({ ...currentUser, ...data.user, isEmailVerified: true });
      } else if (data.user) {
        setCurrentUser(data.user);
      }

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify email.' };
    }
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string; cooldownSeconds?: number; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const data = await authApiService.forgotPassword(cleanEmail);
      return {
        success: true,
        message: data.message,
        cooldownSeconds: data.cooldownSeconds,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to request password reset.' };
    }
  };

  const submitPasswordReset = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const data = await authApiService.resetPassword({
        email: cleanEmail,
        code,
        newPassword,
      });

      return { success: true, message: data.message };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to reset password.' };
    }
  };

  const sendOtpLogin = async (
    email: string
  ): Promise<{ success: boolean; message?: string; cooldownSeconds?: number; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const data = await authApiService.sendOtpLogin(cleanEmail);
      return {
        success: true,
        message: data.message,
        cooldownSeconds: data.cooldownSeconds,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send one-time code.' };
    }
  };

  const verifyOtpLogin = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const data = await authApiService.verifyOtpLogin(cleanEmail, code);

      setCurrentUser(data.user);
      setToken(data.token);
      return { success: true, message: 'Logged in successfully.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to verify login code.' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;

    try {
      if (token) {
        const updated = await authApiService.updateProfile(updates);
        setCurrentUser(updated);
        return;
      }
    } catch {}

    setCurrentUser({ ...currentUser, ...updates });
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        token,
        isAuthenticated: !!currentUser,
        dbStatus,
        checkDbStatus,
        login,
        register,
        logout,
        updateProfile,
        refreshUserProfile,
        sendVerificationCode,
        verifyEmail,
        requestPasswordReset,
        submitPasswordReset,
        sendOtpLogin,
        verifyOtpLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
