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
  googleAuth: (googleUser: any) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
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

// JWT decode utility for real JWT tokens
const isTokenExpired = (token: string): boolean => {
  try {
    // Check if it's a real JWT token (has 3 parts separated by dots)
    const parts = token.split('.');
    if (parts.length !== 3) {
      return true;
    }
    
    // Decode the payload (middle part)
    const payload = JSON.parse(atob(parts[1]));
    
    // Check if token has expiration and if it's expired
    if (!payload.exp) {
      return false; // If no expiration, assume valid
    }
    
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error decoding JWT token:', error);
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

  // API base URL - use bor-server for authentication
  const API_BASE_URL = process.env.VITE_BOR_SERVER_URL || 'http://localhost:6969';

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
      
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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

      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
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

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
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

  const googleAuth = async (googleUser: any): Promise<{ success: boolean; error?: string; isNewUser?: boolean }> => {
    try {
      setIsLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/google`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          googleUser,
          credential: googleUser.credential 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Google authentication failed' };
      }

      const { user: userData, token: authToken, refreshToken: refresh, isNewUser } = data;

      // Store auth data
      setToken(authToken);
      setUser(userData);
      setStoredToken(authToken);
      setStoredUser(userData);
      
      if (refresh) {
        setStoredRefreshToken(refresh);
      }

      return { success: true, isNewUser };
    } catch (error) {
      console.error('Google auth error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const spendPoints = async (amount: number): Promise<boolean> => {
    if (!user || !token || user.points < amount) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/spend-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, reason: 'Points spent via UI' }),
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
    googleAuth,
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