import React, { createContext, useContext, useState, ReactNode } from 'react';

// Simple types for testing
interface User {
  id: string;
  name: string;
  email: string;
  points: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isAuthenticated = !!user && !!token;

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Mock login - replace with real API call to Protocol auth
    setTimeout(() => {
      setUser({
        id: '1',
        name: 'Test User',
        email: email,
        points: 100
      });
      // Mock JWT token - in real implementation, this comes from the API
      setToken('mock-jwt-token-replace-with-real-from-protocol-auth');
      setIsLoading(false);
    }, 1000);

    return { success: true };
  };

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    
    // Mock signup - replace with real API call to Protocol auth
    setTimeout(() => {
      setUser({
        id: '1',
        name: name,
        email: email,
        points: 100
      });
      // Mock JWT token - in real implementation, this comes from the API
      setToken('mock-jwt-token-replace-with-real-from-protocol-auth');
      setIsLoading(false);
    }, 1000);

    return { success: true };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    signup,
    logout,
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