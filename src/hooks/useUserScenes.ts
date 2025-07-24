import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NewStreamConfig, NEW_STREAM_CONFIGS } from '../utils/constants';

interface UserScenePreferences {
  userId: string;
  favoriteAgents: string[];
  selectedAgentId: string;
  customConfigs: NewStreamConfig[];
  lastUsedAgents: string[];
  sessionHistory: {
    agentId: string;
    timestamp: string;
    pointsSpent: number;
  }[];
}

export const useUserScenes = () => {
  const { isAuthenticated, user, token } = useAuth();
  const [userPreferences, setUserPreferences] = useState<UserScenePreferences | null>(null);
  const [availableScenes, setAvailableScenes] = useState<NewStreamConfig[]>(NEW_STREAM_CONFIGS);
  const [selectedAgentId, setSelectedAgentId] = useState<string>(NEW_STREAM_CONFIGS[0]?.agentId || '');
  const [isLoading, setIsLoading] = useState(false);

  // Load user preferences when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadUserPreferences(user.id);
    } else {
      // Use default scenes for anonymous users
      setSelectedAgentId(NEW_STREAM_CONFIGS[0]?.agentId || '');
      setUserPreferences(null);
    }
  }, [isAuthenticated, user]);

  const loadUserPreferences = async (userId: string) => {
    setIsLoading(true);
    try {
      // In real implementation, this would call Protocol backend API
      // For now, use localStorage as demonstration
      const savedPrefs = localStorage.getItem(`user_scenes_${userId}`);
      
      if (savedPrefs) {
        const prefs: UserScenePreferences = JSON.parse(savedPrefs);
        setUserPreferences(prefs);
        setSelectedAgentId(prefs.selectedAgentId || NEW_STREAM_CONFIGS[0]?.agentId);
        
        // Combine default scenes with user custom configs
        const combinedScenes = [
          ...NEW_STREAM_CONFIGS,
          ...prefs.customConfigs
        ];
        setAvailableScenes(combinedScenes);
      } else {
        // Create default preferences for new user
        const defaultPrefs: UserScenePreferences = {
          userId,
          favoriteAgents: [],
          selectedAgentId: NEW_STREAM_CONFIGS[0]?.agentId || '',
          customConfigs: [],
          lastUsedAgents: [],
          sessionHistory: []
        };
        setUserPreferences(defaultPrefs);
        saveUserPreferences(defaultPrefs);
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserPreferences = async (prefs: UserScenePreferences) => {
    try {
      // In real implementation, this would sync with Protocol backend
      localStorage.setItem(`user_scenes_${prefs.userId}`, JSON.stringify(prefs));
      setUserPreferences(prefs);
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  };

  // Select an agent and update user preferences
  const selectAgent = useCallback(async (agentId: string) => {
    setSelectedAgentId(agentId);
    
    if (userPreferences && user) {
      const updatedPrefs: UserScenePreferences = {
        ...userPreferences,
        selectedAgentId: agentId,
        lastUsedAgents: [
          agentId,
          ...userPreferences.lastUsedAgents.filter(id => id !== agentId)
        ].slice(0, 5) // Keep last 5 used agents
      };
      
      await saveUserPreferences(updatedPrefs);
    }
  }, [userPreferences, user]);

  // Add agent to favorites
  const toggleFavoriteAgent = useCallback(async (agentId: string) => {
    if (!userPreferences || !user) return;

    const isFavorite = userPreferences.favoriteAgents.includes(agentId);
    const updatedFavorites = isFavorite
      ? userPreferences.favoriteAgents.filter(id => id !== agentId)
      : [...userPreferences.favoriteAgents, agentId];

    const updatedPrefs: UserScenePreferences = {
      ...userPreferences,
      favoriteAgents: updatedFavorites
    };

    await saveUserPreferences(updatedPrefs);
  }, [userPreferences, user]);

  // Add custom scene configuration
  const addCustomScene = useCallback(async (sceneConfig: NewStreamConfig) => {
    if (!userPreferences || !user) return;

    const updatedPrefs: UserScenePreferences = {
      ...userPreferences,
      customConfigs: [...userPreferences.customConfigs, sceneConfig]
    };

    await saveUserPreferences(updatedPrefs);
    
    // Update available scenes
    setAvailableScenes(prev => [...prev, sceneConfig]);
  }, [userPreferences, user]);

  // Record a session for points tracking
  const recordSession = useCallback(async (agentId: string, pointsSpent: number) => {
    if (!userPreferences || !user) return;

    const sessionRecord = {
      agentId,
      timestamp: new Date().toISOString(),
      pointsSpent
    };

    const updatedPrefs: UserScenePreferences = {
      ...userPreferences,
      sessionHistory: [sessionRecord, ...userPreferences.sessionHistory].slice(0, 50) // Keep last 50 sessions
    };

    await saveUserPreferences(updatedPrefs);
  }, [userPreferences, user]);

  // Get filtered scenes based on user preferences
  const getFavoriteScenes = useCallback(() => {
    if (!userPreferences) return [];
    
    return availableScenes.filter(scene => 
      userPreferences.favoriteAgents.includes(scene.agentId)
    );
  }, [availableScenes, userPreferences]);

  const getRecentScenes = useCallback(() => {
    if (!userPreferences) return [];
    
    return userPreferences.lastUsedAgents
      .map(agentId => availableScenes.find(scene => scene.agentId === agentId))
      .filter(Boolean) as NewStreamConfig[];
  }, [availableScenes, userPreferences]);

  const getCurrentScene = useCallback(() => {
    return availableScenes.find(scene => scene.agentId === selectedAgentId);
  }, [availableScenes, selectedAgentId]);

  // Get session statistics
  const getSessionStats = useCallback(() => {
    if (!userPreferences) return null;

    const totalSessions = userPreferences.sessionHistory.length;
    const totalPointsSpent = userPreferences.sessionHistory.reduce(
      (sum, session) => sum + session.pointsSpent, 0
    );
    const favoriteAgentId = userPreferences.sessionHistory
      .reduce((acc, session) => {
        acc[session.agentId] = (acc[session.agentId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    
    const mostUsedAgent = Object.entries(favoriteAgentId)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    return {
      totalSessions,
      totalPointsSpent,
      mostUsedAgent,
      favoritesCount: userPreferences.favoriteAgents.length
    };
  }, [userPreferences]);

  return {
    // State
    isAuthenticated,
    user,
    userPreferences,
    availableScenes,
    selectedAgentId,
    isLoading,
    
    // Scene data
    currentScene: getCurrentScene(),
    favoriteScenes: getFavoriteScenes(),
    recentScenes: getRecentScenes(),
    sessionStats: getSessionStats(),
    
    // Actions
    selectAgent,
    toggleFavoriteAgent,
    addCustomScene,
    recordSession,
    
    // Auth token for API calls
    authToken: token
  };
};