import { useEffect, useCallback } from 'react';
import { useScene } from '../contexts/ScenesContext';
import { useUserScenes } from './useUserScenes';
import { useAuth } from '../contexts/AuthContext';
import { NewStreamConfig } from '../utils/constants';

/**
 * Hook that bridges the gap between user agent selection and the existing 3D scene system
 * Integrates authentication with the Scene/3D rendering system
 */
export const useAgentIntegration = () => {
  const { isAuthenticated, user } = useAuth();
  const {
    setCurrentAgentId,
    setCurrentSceneIndex,
    newScenes,
    updateScene
  } = useScene();
  
  const {
    selectedAgentId,
    currentScene,
    selectAgent,
    addCustomScene,
    recordSession
  } = useUserScenes();

  // Sync user-selected agent with the 3D scene system
  useEffect(() => {
    if (selectedAgentId && selectedAgentId !== '') {
      console.log('🎬 Integrating user-selected agent with 3D scene:', selectedAgentId);
      
      // Find the scene index that matches the selected agent
      const sceneIndex = newScenes.findIndex(scene => scene.agentId === selectedAgentId);
      
      if (sceneIndex !== -1) {
        // Use existing scene configuration
        setCurrentSceneIndex(sceneIndex);
        setCurrentAgentId(selectedAgentId);
        console.log('✅ Found existing scene configuration, index:', sceneIndex);
      } else if (currentScene) {
        // Add new custom scene configuration to the scene system
        console.log('🆕 Adding new custom scene configuration');
        addCustomSceneToSystem(currentScene);
      }
    }
  }, [selectedAgentId, currentScene, newScenes, setCurrentAgentId, setCurrentSceneIndex]);

  // Add a custom scene configuration to the existing scene system
  const addCustomSceneToSystem = useCallback(async (sceneConfig: NewStreamConfig) => {
    try {
      // Update the scene system with the new configuration
      updateScene(sceneConfig);
      
      // Set this as the current scene
      const newSceneIndex = newScenes.length; // It will be added at the end
      setCurrentSceneIndex(newSceneIndex);
      setCurrentAgentId(sceneConfig.agentId);
      
      console.log('✅ Successfully added custom scene to system:', sceneConfig.title);
    } catch (error) {
      console.error('❌ Failed to add custom scene to system:', error);
    }
  }, [updateScene, newScenes.length, setCurrentSceneIndex, setCurrentAgentId]);

  // Start a private session with the current agent
  const startPrivateSession = useCallback(async () => {
    if (!isAuthenticated || !user || !selectedAgentId) {
      console.error('Cannot start private session: user not authenticated or no agent selected');
      return false;
    }

    try {
      // Check if user has enough points
      if (user.points < 10) {
        console.error('Insufficient points for private session');
        return false;
      }

      // Record the session
      await recordSession(selectedAgentId, 10);
      
      // Here you would integrate with the Socket.io system to start a private session
      // For now, we'll just log the action
      console.log('🎯 Starting private session with agent:', selectedAgentId);
      
      // Could emit a socket event for private session
      // socket.emit('start_private_session', { agentId: selectedAgentId, userId: user.id });
      
      return true;
    } catch (error) {
      console.error('❌ Failed to start private session:', error);
      return false;
    }
  }, [isAuthenticated, user, selectedAgentId, recordSession]);

  // Get the current 3D scene configuration that's actively rendered
  const getActive3DScene = useCallback(() => {
    if (!selectedAgentId) return null;
    
    const activeScene = newScenes.find(scene => scene.agentId === selectedAgentId);
    return activeScene || null;
  }, [selectedAgentId, newScenes]);

  // Check if the selected agent has a 3D model available
  const hasValidModel = useCallback(() => {
    const active3DScene = getActive3DScene();
    if (!active3DScene) return false;
    
    const hasModel = active3DScene.sceneConfigs?.[0]?.models?.length > 0;
    const modelFile = active3DScene.sceneConfigs?.[0]?.models?.[0]?.model;
    
    return hasModel && modelFile && modelFile.endsWith('.vrm');
  }, [getActive3DScene]);

  // Get information about the current 3D setup
  const get3DInfo = useCallback(() => {
    const active3DScene = getActive3DScene();
    if (!active3DScene) return null;

    const sceneConfig = active3DScene.sceneConfigs?.[0];
    if (!sceneConfig) return null;

    const model = sceneConfig.models?.[0];
    if (!model) return null;

    return {
      sceneName: active3DScene.title,
      agentId: active3DScene.agentId,
      modelFile: model.model,
      environment: sceneConfig.environmentURL,
      defaultAnimation: model.defaultAnimation,
      position: model.modelPosition,
      rotation: model.modelRotation,
      scale: model.modelScale
    };
  }, [getActive3DScene]);

  return {
    // State
    isAuthenticated,
    selectedAgentId,
    currentScene,
    hasValidModel: hasValidModel(),
    sceneInfo: get3DInfo(),
    
    // Actions
    selectAgent,
    startPrivateSession,
    addCustomSceneToSystem,
    
    // Scene system integration
    active3DScene: getActive3DScene(),
    
    // Helper functions
    canStartPrivateSession: isAuthenticated && user && user.points >= 10 && selectedAgentId,
  };
};