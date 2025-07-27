import axios from 'axios';
import { API_URL } from '../utils/constants';

// Types for session booking
export interface ModelConfig {
  modelName: string;
  displayName: string;
  accessType: 'free' | 'premium';
  pointsCost: number;
  sessionDurationMinutes: number;
  description?: string;
}

export interface ModelAccessResponse {
  success: boolean;
  access: 'granted' | 'available';
  modelConfig: ModelConfig;
  availability?: {
    activeSessions: number;
    maxConcurrent: number;
    queueLength: number;
    estimatedWaitMinutes: number;
  };
  error?: string;
  required?: number;
  current?: number;
}

export interface SessionBookingResponse {
  success: boolean;
  session?: {
    id: string;
    modelName: string;
    status: 'active' | 'queued';
    type: 'public' | 'private';
    startTime?: string;
    endTime?: string;
    durationMinutes?: number;
    queuePosition?: number;
    estimatedWaitMinutes?: number;
    message?: string;
    redirectUrl?: string;
  };
  newBalance?: number;
  error?: string;
}

export interface ModelsResponse {
  success: boolean;
  models: ModelConfig[];
}

class SessionService {
  private getAuthHeaders() {
    const token = localStorage.getItem('bor_auth_token');
    console.log('SessionService: Auth token from localStorage:', token ? 'Found' : 'Not found');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Get all available models
  async getModels(): Promise<ModelsResponse> {
    try {
      const response = await axios.get(`${API_URL}/api/models`);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching models:', error);
      return {
        success: false,
        models: []
      };
    }
  }

  // Check access for a specific model
  async checkModelAccess(modelName: string): Promise<ModelAccessResponse> {
    try {
      // Always send auth headers if available, server will handle free vs premium logic
      const headers = this.getAuthHeaders();
      console.log('Checking access for model:', modelName, 'Headers:', headers);
      
      const response = await axios.post(
        `${API_URL}/api/models/${modelName}/check-access`,
        {},
        { headers: Object.keys(headers).length > 0 ? headers : undefined }
      );
      
      console.log('Access check response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error checking model access:', error.response?.data || error);
      return {
        success: false,
        access: 'granted',
        modelConfig: {
          modelName,
          displayName: modelName,
          accessType: 'free',
          pointsCost: 0,
          sessionDurationMinutes: 0
        },
        error: error.response?.data?.error || 'Failed to check access'
      };
    }
  }

  // Book a session
  async bookSession(modelName: string): Promise<SessionBookingResponse> {
    try {
      const response = await axios.post(
        `${API_URL}/api/sessions/book`,
        { modelName },
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error booking session:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to book session'
      };
    }
  }

  // Get current session status
  async getCurrentSession(): Promise<any> {
    try {
      const response = await axios.get(
        `${API_URL}/api/sessions/current`,
        { headers: this.getAuthHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error getting current session:', error);
      return {
        success: false,
        session: null,
        error: error.response?.data?.error || 'Failed to get session'
      };
    }
  }

  // Validate session access for a specific model route
  async validateSessionAccess(modelName: string, sessionId?: string): Promise<boolean> {
    try {
      // For free models, always allow access
      const modelAccess = await this.checkModelAccess(modelName);
      if (modelAccess.modelConfig?.accessType === 'free') {
        return true;
      }

      // For premium models, check if user has an active session
      const currentSession = await this.getCurrentSession();
      if (!currentSession.success || !currentSession.session) {
        return false;
      }

      // Check if session matches the model
      const session = currentSession.session;
      
      // Verify session is active and matches the requested model
      if (session.status !== 'active') {
        return false;
      }
      
      // If sessionId is provided, verify it matches
      if (sessionId && session.id !== sessionId) {
        return false;
      }
      
      // Verify the session is for the correct model
      if (session.modelName && session.modelName !== modelName) {
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error validating session access:', error);
      return false;
    }
  }
}

export const sessionService = new SessionService();
export default sessionService;