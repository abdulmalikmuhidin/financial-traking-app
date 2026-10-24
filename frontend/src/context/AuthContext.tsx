import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { DEMO_USER } from '../utils/mockData';

export interface DbStatusInfo {
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
  loginAsDemo: () => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
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
      // Fallback local authentication if backend endpoint unreachable
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
  ): Promise<{ success: boolean; error?: string }> => {
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
      return { success: true };
    } catch (err) {
      return { success: false, error: 'Network error during registration.' };
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
        checkDbStatus,
        login,
        register,
        loginAsDemo,
        logout,
        updateProfile,
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
