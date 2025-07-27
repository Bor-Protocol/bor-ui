import { useState, useEffect, useCallback } from 'react';
import { sessionService, ModelConfig, SessionBookingResponse } from '../services/sessionService';
import { useAuth } from '../contexts/AuthContext';

interface UseSessionBookingReturn {
  models: ModelConfig[];
  currentSession: any;
  isLoading: boolean;
  error: string | null;
  bookSession: (modelName: string) => Promise<SessionBookingResponse>;
  checkAccess: (modelName: string) => Promise<any>;
  validateAccess: (modelName: string, sessionId?: string) => Promise<boolean>;
  refreshSession: () => Promise<void>;
}

export function useSessionBooking(): UseSessionBookingReturn {
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [currentSession, setCurrentSession] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, refreshPointsInfo } = useAuth();

  // Load models on mount
  useEffect(() => {
    loadModels();
  }, []);

  // Load current session when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshSession();
    } else {
      setCurrentSession(null);
    }
  }, [isAuthenticated]);

  const loadModels = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await sessionService.getModels();
      if (response.success) {
        setModels(response.models);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load models');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshSession = useCallback(async () => {
    if (!isAuthenticated) {
      setCurrentSession(null);
      return;
    }

    try {
      const response = await sessionService.getCurrentSession();
      if (response.success) {
        setCurrentSession(response.session);
      }
    } catch (err: any) {
      console.error('Error refreshing session:', err);
    }
  }, [isAuthenticated]);

  const checkAccess = useCallback(async (modelName: string) => {
    try {
      setError(null);
      const response = await sessionService.checkModelAccess(modelName);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to check access');
      throw err;
    }
  }, []);

  const bookSession = useCallback(async (modelName: string): Promise<SessionBookingResponse> => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await sessionService.bookSession(modelName);
      
      if (response.success) {
        // Refresh session data and user points
        await refreshSession();
        if (refreshPointsInfo) {
          await refreshPointsInfo();
        }
      }
      
      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to book session';
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    } finally {
      setIsLoading(false);
    }
  }, [refreshSession, refreshPointsInfo]);

  const validateAccess = useCallback(async (modelName: string, sessionId?: string): Promise<boolean> => {
    try {
      return await sessionService.validateSessionAccess(modelName, sessionId);
    } catch (err: any) {
      console.error('Error validating access:', err);
      return false;
    }
  }, []);

  return {
    models,
    currentSession,
    isLoading,
    error,
    bookSession,
    checkAccess,
    validateAccess,
    refreshSession
  };
}