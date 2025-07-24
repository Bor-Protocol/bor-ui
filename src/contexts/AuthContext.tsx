import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Types for our authentication system
export interface User {
  id: string;
  name: string;
  email: string;
  points: number;
  user_type: 'user' | 'creator' | 'admin';
  subscription_tier: 'free' | 'premium' | 'enterprise';
  is_active: boolean;
  email_verified: boolean;
  total_sessions: number;
  points_next_regen: string;
  avatar?: string;
  preferences?: Record<string, any>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  spendPoints: (amount: number) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT token utilities
const TOKEN_KEY = 'bor_auth_token';
const REFRESH_TOKEN_KEY = 'bor_refresh_token';
const USER_KEY = 'bor_user';

const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const getStoredRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

const getStoredUser = (): User | null => {
  const stored = localStorage.getItem(USER_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const setStoredToken = (token: string) => {
  localStorage.setItem(TOKEN_KEY, token);
};

const setStoredRefreshToken = (refreshToken: string) => {
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
};

const setStoredUser = (user: User) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearStoredAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// JWT decode utility (simple)
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // API base URL - update this to match your Protocol backend
  const API_BASE_URL = process.env.VITE_PROTOCOL_API_URL || 'http://localhost:3000/api';

  const isAuthenticated = !!user && !!token;

  // Initialize auth state from localStorage
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getStoredToken();
      const storedUser = getStoredUser();

      if (storedToken && storedUser) {
        if (isTokenExpired(storedToken)) {
          // Try to refresh token
          const refreshed = await refreshToken();
          if (!refreshed) {
            clearStoredAuth();
          }
        } else {
          setToken(storedToken);
          setUser(storedUser);
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // Auto refresh token before expiry
  useEffect(() => {
    if (!token) return;

    const checkTokenExpiry = () => {
      if (isTokenExpired(token)) {
        refreshToken();
      }
    };

    const interval = setInterval(checkTokenExpiry, 5 * 60 * 1000); // Check every 5 minutes
    return () => clearInterval(interval);
  }, [token]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      const { user: userData, token: authToken, refreshToken: refresh } = data;

      // Store auth data
      setToken(authToken);
      setUser(userData);
      setStoredToken(authToken);
      setStoredUser(userData);
      
      if (refresh) {
        setStoredRefreshToken(refresh);
      }

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Signup failed' };
      }

      const { user: userData, token: authToken, refreshToken: refresh } = data;

      // Store auth data
      setToken(authToken);
      setUser(userData);
      setStoredToken(authToken);
      setStoredUser(userData);
      
      if (refresh) {
        setStoredRefreshToken(refresh);
      }

      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    clearStoredAuth();
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const refresh = getStoredRefreshToken();
      if (!refresh) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: refresh }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      const { user: userData, token: newToken, refreshToken: newRefresh } = data;

      setToken(newToken);
      setUser(userData);
      setStoredToken(newToken);
      setStoredUser(userData);
      
      if (newRefresh) {
        setStoredRefreshToken(newRefresh);
      }

      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  };

  const updateUser = (updates: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    setStoredUser(updatedUser);
  };

  const spendPoints = async (amount: number): Promise<boolean> => {
    if (!user || !token || user.points < amount) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/users/spend-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      updateUser({ points: data.newBalance });
      
      return true;
    } catch (error) {
      console.error('Spend points error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
    refreshToken,
    updateUser,
    spendPoints,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};