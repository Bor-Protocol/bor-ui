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

export interface PointsInfo {
  points: number;
  maxPoints: number;
  dailyRegenAmount: number;
  nextRegeneration: string | null;
  timeUntilRegenMs: number;
  canRegenerate: boolean;
}

export interface AgentAvailability {
  isAvailable: boolean;
  queueLength: number;
  estimatedWaitTime: number;
  remainingTimeSeconds?: number;
  currentSession?: {
    name: string;
    email: string;
    startTime: string;
    endTime: string;
    remainingSeconds: number;
  } | null;
  queueDetails?: Array<{
    position: number;
    userId: string;
    userName: string;
    userEmail: string;
    addedAt: string;
    estimatedStartTime: string;
  }>;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  pointsInfo: PointsInfo | null;
  currentSession: any | null;
  hasActiveSession: boolean;
  agentAvailability: Record<string, AgentAvailability> | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  googleAuth: (googleUser: any) => Promise<{ success: boolean; error?: string; isNewUser?: boolean }>;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
  updateUser: (updates: Partial<User>) => void;
  spendPoints: (amount: number, reason?: string) => Promise<boolean>;
  bookPrivateSession: (agentId: string) => Promise<{ success: boolean; session?: any; error?: string }>;
  getPointsHistory: () => Promise<any[]>;
  refreshPointsInfo: () => Promise<void>;
  getCurrentSession: () => Promise<any>;
  cancelSession: (sessionId: string) => Promise<{ success: boolean; error?: string }>;
  getAgentAvailability: () => Promise<void>;
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
  const [pointsInfo, setPointsInfo] = useState<PointsInfo | null>(null);
  const [currentSession, setCurrentSession] = useState<any | null>(null);
  const [agentAvailability, setAgentAvailability] = useState<Record<string, AgentAvailability> | null>(null);

  // API base URL - use bor-server for authentication
  const API_BASE_URL = process.env.VITE_BOR_SERVER_URL || 'http://localhost:6969';

  const isAuthenticated = !!user && !!token;
  const hasActiveSession = !!currentSession && (currentSession.status === 'active' || currentSession.status === 'queued');

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

  // Refresh points info from server
  const refreshPointsInfo = async (): Promise<void> => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/points-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPointsInfo(data);
        // Also update user points in case they changed
        if (user && data.points !== user.points) {
          updateUser({ points: data.points });
        }
      }
    } catch (error) {
      console.error('Refresh points info error:', error);
    }
  };

  // Load points info and session info after login
  useEffect(() => {
    if (isAuthenticated) {
      if (!pointsInfo) {
        refreshPointsInfo();
      }
      getCurrentSession();
    }
    // Always get agent availability (doesn't require authentication)
    getAgentAvailability();
  }, [isAuthenticated]);

  // Poll for session updates every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (isAuthenticated) {
        getCurrentSession();
      }
      getAgentAvailability(); // Always poll agent availability
    }, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const spendPoints = async (amount: number, reason?: string): Promise<boolean> => {
    if (!user || !token || user.points < amount) return false;

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/spend-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount, reason: reason || 'Points spent via UI' }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      updateUser({ points: data.newBalance });
      refreshPointsInfo(); // Refresh full points info
      
      return true;
    } catch (error) {
      console.error('Spend points error:', error);
      return false;
    }
  };

  const bookPrivateSession = async (agentId: string): Promise<{ success: boolean; session?: any; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/book-private`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ agentId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to book session' };
      }

      // Update user points
      updateUser({ points: data.newBalance });
      refreshPointsInfo();

      return { success: true, session: data.session };
    } catch (error) {
      console.error('Book private session error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const getPointsHistory = async (): Promise<any[]> => {
    if (!token) return [];

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/points-history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return data.transactions || [];
      }
    } catch (error) {
      console.error('Get points history error:', error);
    }

    return [];
  };

  const getCurrentSession = async (): Promise<any> => {
    if (!token) return null;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentSession(data.session);
        return data.session;
      }
    } catch (error) {
      console.error('Get current session error:', error);
    }

    setCurrentSession(null);
    return null;
  };

  const getAgentAvailability = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/availability`);

      if (response.ok) {
        const data = await response.json();
        setAgentAvailability(data.agents);
      }
    } catch (error) {
      console.error('Get agent availability error:', error);
    }
  };

  const cancelSession = async (sessionId: string): Promise<{ success: boolean; error?: string }> => {
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to cancel session' };
      }

      // Refresh points after refund and clear session
      refreshPointsInfo();
      setCurrentSession(null);

      return { success: true };
    } catch (error) {
      console.error('Cancel session error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    pointsInfo,
    currentSession,
    hasActiveSession,
    agentAvailability,
    login,
    signup,
    googleAuth,
    logout,
    refreshToken,
    updateUser,
    spendPoints,
    bookPrivateSession,
    getPointsHistory,
    refreshPointsInfo,
    getCurrentSession,
    cancelSession,
    getAgentAvailability,
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