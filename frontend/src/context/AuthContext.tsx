import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { DEMO_USER } from '../utils/mockData';

export interface DbStatusInfo {
  isConnected: boolean;
  dbError: string | null;
  databaseName?: string;
}

export interface VerificationNotice {
  email: string;
  code?: string;
  type: 'verification' | 'reset' | 'otp';
  timestamp: number;
}

interface AuthContextType {
  currentUser: User | null;
  token: string | null;
  isAuthenticated: boolean;
  dbStatus: DbStatusInfo;
  latestNotice: VerificationNotice | null;
  dismissNotice: () => void;
  checkDbStatus: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, preferredCurrency: string) => Promise<{ success: boolean; previewCode?: string; error?: string }>;
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  sendVerificationCode: (email?: string) => Promise<{ success: boolean; message?: string; previewCode?: string; error?: string }>;
  verifyEmail: (code: string, email?: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  requestPasswordReset: (email: string) => Promise<{ success: boolean; message?: string; previewCode?: string; error?: string }>;
  submitPasswordReset: (email: string, code: string, newPassword: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  sendOtpLogin: (email: string) => Promise<{ success: boolean; message?: string; previewCode?: string; error?: string }>;
  verifyOtpLogin: (email: string, code: string) => Promise<{ success: boolean; message?: string; error?: string }>;
}

const AUTH_STORAGE_KEY = 'fintrack_auth_user';
const TOKEN_STORAGE_KEY = 'fintrack_auth_token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [dbStatus, setDbStatus] = useState<DbStatusInfo>({
    isConnected: false,
    dbError: null,
  });

  const [latestNotice, setLatestNotice] = useState<VerificationNotice | null>(null);

  const dismissNotice = () => setLatestNotice(null);

  const checkDbStatus = async () => {
    try {
      const res = await fetch('/api/auth/db-status');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data);
      }
    } catch {
      // Backend starting or offline
    }
  };

  useEffect(() => {
    checkDbStatus();
    const interval = setInterval(checkDbStatus, 8000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }

      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth state', e);
    }
  }, [currentUser, token]);

  const refreshUserProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch {}
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed. Please check credentials.' };
      }

      setCurrentUser(data.user);
      setToken(data.token);
      return { success: true };
    } catch (err) {
      if (cleanEmail === DEMO_USER.email.toLowerCase() && password.length >= 6) {
        setCurrentUser(DEMO_USER);
        setToken('demo-token');
        return { success: true };
      }
      return { success: false, error: 'Could not connect to authentication service.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    preferredCurrency: string
  ): Promise<{ success: boolean; previewCode?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: cleanName,
          email: cleanEmail,
          password,
          preferredCurrency: preferredCurrency || 'USD',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed.' };
      }

      setCurrentUser(data.user);
      setToken(data.token);

      if (data.previewCode) {
        setLatestNotice({
          email: cleanEmail,
          code: data.previewCode,
          type: 'verification',
          timestamp: Date.now(),
        });
      }

      return { success: true, previewCode: data.previewCode };
    } catch (err) {
      return { success: false, error: 'Network error during registration.' };
    }
  };

  const sendVerificationCode = async (
    targetEmail?: string
  ): Promise<{ success: boolean; message?: string; previewCode?: string; error?: string }> => {
    const emailToUse = targetEmail || currentUser?.email;
    if (!emailToUse) {
      return { success: false, error: 'No email address provided.' };
    }

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/send-verification', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: emailToUse }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send verification code.' };
      }

      if (data.previewCode) {
        setLatestNotice({
          email: emailToUse,
          code: data.previewCode,
          type: 'verification',
          timestamp: Date.now(),
        });
      }

      return {
        success: true,
        message: data.message,
        previewCode: data.previewCode,
      };
    } catch (err) {
      return { success: false, error: 'Network error while sending verification email.' };
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
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: emailToUse, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to verify email.' };
      }

      if (data.user && currentUser && currentUser.email === data.user.email) {
        setCurrentUser({ ...currentUser, ...data.user, isEmailVerified: true });
      } else if (data.user) {
        setCurrentUser(data.user);
      }

      setLatestNotice(null);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: 'Network error during verification.' };
    }
  };

  const requestPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; message?: string; previewCode?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to request reset.' };
      }

      if (data.previewCode) {
        setLatestNotice({
          email: cleanEmail,
          code: data.previewCode,
          type: 'reset',
          timestamp: Date.now(),
        });
      }

      return { success: true, message: data.message, previewCode: data.previewCode };
    } catch (err) {
      return { success: false, error: 'Network error while requesting password reset.' };
    }
  };

  const submitPasswordReset = async (
    email: string,
    code: string,
    newPassword: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to reset password.' };
      }

      if (data.token && data.user) {
        setCurrentUser(data.user);
        setToken(data.token);
      }

      setLatestNotice(null);
      return { success: true, message: data.message };
    } catch (err) {
      return { success: false, error: 'Network error while updating password.' };
    }
  };

  const sendOtpLogin = async (
    email: string
  ): Promise<{ success: boolean; message?: string; previewCode?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/send-otp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to send one-time code.' };
      }

      if (data.previewCode) {
        setLatestNotice({
          email: cleanEmail,
          code: data.previewCode,
          type: 'otp',
          timestamp: Date.now(),
        });
      }

      return { success: true, message: data.message, previewCode: data.previewCode };
    } catch (err) {
      return { success: false, error: 'Network error while sending OTP login code.' };
    }
  };

  const verifyOtpLogin = async (
    email: string,
    code: string
  ): Promise<{ success: boolean; message?: string; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();

    try {
      const res = await fetch('/api/auth/verify-otp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, code }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Failed to verify login code.' };
      }

      setCurrentUser(data.user);
      setToken(data.token);
      setLatestNotice(null);
      return { success: true, message: 'Logged in successfully.' };
    } catch (err) {
      return { success: false, error: 'Network error while verifying login code.' };
    }
  };

  const loginAsDemo = async () => {
    try {
      const res = await fetch('/api/auth/demo', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data.user);
        setToken(data.token);
        return;
      }
    } catch {}

    setCurrentUser(DEMO_USER);
    setToken('demo-token');
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setLatestNotice(null);
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;

    try {
      if (token) {
        const res = await fetch('/api/auth/profile', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updates),
        });

        if (res.ok) {
          const updated = await res.json();
          setCurrentUser(updated);
          return;
        }
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
        latestNotice,
        dismissNotice,
        checkDbStatus,
        login,
        register,
        loginAsDemo,
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
