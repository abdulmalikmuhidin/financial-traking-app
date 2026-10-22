import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { DEMO_USER } from '../utils/mockData';

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) =>Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string, preferredCurrency: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => void;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => void;
}

const AUTH_STORAGE_KEY = 'fintrack_auth_user';
const USERS_STORAGE_KEY = 'fintrack_registered_users';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    // Default to DEMO_USER for smooth immediate preview
    return DEMO_USER;
  });

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(currentUser));
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (e) {
      console.error('Failed to sync auth state', e);
    }
  }, [currentUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Artificial slight delay for realistic UX feedback
    await new Promise((r) => setTimeout(r, 400));

    const cleanEmail = email.trim().toLowerCase();

    // Check if it's the demo account
    if (cleanEmail === DEMO_USER.email.toLowerCase()) {
      if (password.length >= 6) {
        setCurrentUser(DEMO_USER);
        return { success: true };
      }
      return { success: false, error: 'Demo password must be at least 6 characters (e.g. "password123").' };
    }

    // Check registered users
    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];
      const matched = storedUsers.find((u: any) => u.email.toLowerCase() === cleanEmail);

      if (!matched) {
        return { success: false, error: 'No account found with this email. Try Demo Account or register.' };
      }

      if (matched.password !== password) {
        return { success: false, error: 'Incorrect password. Please verify and try again.' };
      }

      const userProfile: User = {
        id: matched.id,
        name: matched.name,
        email: matched.email,
        jobTitle: matched.jobTitle || 'Finance Member',
        preferredCurrency: matched.preferredCurrency || 'USD',
        isDemoUser: false,
        monthlyIncomeTarget: matched.monthlyIncomeTarget || 5000,
        alertThresholdPercent: 80,
        createdAt: matched.createdAt,
      };

      setCurrentUser(userProfile);
      return { success: true };
    } catch {
      return { success: false, error: 'Authentication service encountered a problem.' };
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    preferredCurrency: string
  ): Promise<{ success: boolean; error?: string }> => {
    await new Promise((r) => setTimeout(r, 400));

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'Please enter a valid full name.' };
    }

    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters.' };
    }

    if (cleanEmail === DEMO_USER.email.toLowerCase()) {
      return { success: false, error: 'This email is reserved for the Demo Account. Click "Try Demo Account" to log in.' };
    }

    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      const storedUsers = storedUsersRaw ? JSON.parse(storedUsersRaw) : [];

      if (storedUsers.some((u: any) => u.email.toLowerCase() === cleanEmail)) {
        return { success: false, error: 'An account with this email already exists. Please log in.' };
      }

      const newId = `user-${Date.now()}`;
      const newUserRecord = {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        password, // stored locally in demo app namespace
        jobTitle: 'Personal Account',
        preferredCurrency: preferredCurrency || 'USD',
        createdAt: new Date().toISOString(),
      };

      storedUsers.push(newUserRecord);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));

      const activeUser: User = {
        id: newId,
        name: cleanName,
        email: cleanEmail,
        jobTitle: 'Personal Account',
        preferredCurrency: preferredCurrency || 'USD',
        isDemoUser: false,
        monthlyIncomeTarget: 5000,
        alertThresholdPercent: 80,
        createdAt: newUserRecord.createdAt,
      };

      setCurrentUser(activeUser);
      return { success: true };
    } catch {
      return { success: false, error: 'Registration failed due to storage error.' };
    }
  };

  const loginAsDemo = () => {
    setCurrentUser(DEMO_USER);
  };

  const logout = () => {
    setCurrentUser(null);
  };

  const updateProfile = (updates: Partial<User>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updates };
    setCurrentUser(updated);

    // If registered user, update local storage list
    if (!currentUser.isDemoUser) {
      try {
        const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        if (storedUsersRaw) {
          const storedUsers = JSON.parse(storedUsersRaw);
          const idx = storedUsers.findIndex((u: any) => u.id === currentUser.id);
          if (idx !== -1) {
            storedUsers[idx] = { ...storedUsers[idx], ...updates };
            localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(storedUsers));
          }
        }
      } catch (e) {
        console.error('Failed to update stored user', e);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
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
