import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { NewStreamConfig, SceneConfig } from '../utils/constants';

interface AgentOption {
  id: string;
  name: string;
  description: string;
  modelFile: string;
  avatar: string;
  personality: string;
  defaultAnimation: string;
  environment: string;
  category: 'political' | 'entertainment' | 'business' | 'custom';
}

// Available agent configurations
const AVAILABLE_AGENTS: AgentOption[] = [
  {
    id: "795df77f-1620-07db-bd9a-0e2dfefef248",
    name: "Trump",
    description: "Political figure with animated expressions",
    modelFile: "tromp.vrm",
    avatar: "/images/trump-avatar.png",
    personality: "Confident, expressive, animated speaker",
    defaultAnimation: "idlet",
    environment: "tt.glb",
    category: "political"
  },
  {
    id: "bor-agent-001",
    name: "BOR Assistant",
    description: "Friendly AI assistant for general conversations",
    modelFile: "bor_model.vrm",
    avatar: "/images/bor.webp",
    personality: "Helpful, knowledgeable, friendly",
    defaultAnimation: "idle",
    environment: "tt.glb",
    category: "business"
  },
  {
    id: "trump-variant-001",
    name: "Trump Casual",
    description: "Casual version with different animations",
    modelFile: "trump.vrm",
    avatar: "/images/trump-casual.png",
    personality: "Relaxed, conversational",
    defaultAnimation: "happy_idle",
    environment: "trump_room.glb",
    category: "political"
  }
];

interface AgentSelectionProps {
  onAgentSelect: (agentConfig: NewStreamConfig) => void;
  selectedAgentId?: string;
  className?: string;
}

export const AgentSelection: React.FC<AgentSelectionProps> = ({
  onAgentSelect,
  selectedAgentId,
  className = ""
}) => {
  const { isAuthenticated, user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [userPreferences, setUserPreferences] = useState<{
    favoriteAgents: string[];
    customSettings: Record<string, any>;
  }>({
    favoriteAgents: [],
    customSettings: {}
  });

  const filteredAgents = AVAILABLE_AGENTS.filter(agent => 
    selectedCategory === 'all' || agent.category === selectedCategory
  );

  // Load user preferences when authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      // In real implementation, fetch from Protocol backend
      // For now, use localStorage as demo
      const savedPrefs = localStorage.getItem(`agent_prefs_${user.id}`);
      if (savedPrefs) {
        setUserPreferences(JSON.parse(savedPrefs));
      }
    }
  }, [isAuthenticated, user]);

  const saveUserPreferences = (prefs: typeof userPreferences) => {
    if (user) {
      localStorage.setItem(`agent_prefs_${user.id}`, JSON.stringify(prefs));
      setUserPreferences(prefs);
    }
  };

  const toggleFavorite = (agentId: string) => {
    if (!isAuthenticated) return;
    
    const newFavorites = userPreferences.favoriteAgents.includes(agentId)
      ? userPreferences.favoriteAgents.filter(id => id !== agentId)
      : [...userPreferences.favoriteAgents, agentId];
    
    saveUserPreferences({
      ...userPreferences,
      favoriteAgents: newFavorites
    });
  };

  const createAgentConfig = (agent: AgentOption): NewStreamConfig => {
    return {
      id: Date.now(),
      title: `${agent.name} Stream`,
      agentId: agent.id,
      twitter: "@bor_live",
      modelName: agent.name,
      identifier: agent.name,
      description: agent.description,
      color: "#FE2C55",
      type: "stream",
      component: "ThreeScene",
      creator: { 
        avatar: agent.avatar, 
        title: agent.personality, 
        username: agent.name 
      },
      bgm: "/audio/musicbg.mp3",
      sceneConfigs: [{
        id: 0,
        name: `${agent.name} Scene`,
        environmentURL: agent.environment,
        models: [{
          model: agent.modelFile,
          name: agent.name,
          agentId: agent.id,
          description: agent.description,
          clothes: "casual",
          defaultAnimation: agent.defaultAnimation,
          modelPosition: [1.51, -0.5, -7.65],
          modelRotation: [0, 7.8, 0],
          modelScale: [0.96, 0.96, 0.96]
        }],
        environmentScale: [1, 1, 1],
        environmentPosition: [3, -1, -3.5],
        environmentRotation: [0, 1.57, 0],
        cameraPitch: 0,
        cameraPosition: [2.86, 0.76, -7.73],
        cameraRotation: -4.71
      }],
      stats: { comments: 0 },
      clothes: "casual"
    };
  };

  const handleAgentSelect = (agent: AgentOption) => {
    const config = createAgentConfig(agent);
    onAgentSelect(config);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">Select Your AI Agent</h3>
        <p className="text-gray-600">
          {isAuthenticated 
            ? `Choose an agent to interact with, ${user?.name}!`
            : "Sign in to save your favorite agents and preferences"
          }
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'political', 'entertainment', 'business', 'custom'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAgents.map(agent => {
          const isFavorite = userPreferences.favoriteAgents.includes(agent.id);
          const isSelected = selectedAgentId === agent.id;
          
          return (
            <div
              key={agent.id}
              className={`relative border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleAgentSelect(agent)}
            >
              {/* Favorite Button */}
              {isAuthenticated && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(agent.id);
                  }}
                  className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center ${
                    isFavorite 
                      ? 'text-red-500 bg-red-100' 
                      : 'text-gray-400 bg-gray-100 hover:text-red-500'
                  }`}
                >
                  {isFavorite ? '❤️' : '🤍'}
                </button>
              )}

              {/* Agent Avatar */}
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-lg">🤖</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {agent.category}
                  </span>
                </div>
              </div>

              {/* Agent Info */}
              <p className="text-sm text-gray-600 mb-2">{agent.description}</p>
              <p className="text-xs text-gray-500 italic">{agent.personality}</p>

              {/* Selection Indicator */}
              {isSelected && (
                <div className="absolute bottom-2 right-2">
                  <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>
              )}

              {/* Premium Badge for certain agents */}
              {agent.category === 'custom' && (
                <div className="absolute top-2 left-2">
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Premium
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Points Cost Info for Authenticated Users */}
      {isAuthenticated && (
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-yellow-800">Private Session Cost</h4>
              <p className="text-sm text-yellow-700">
                Each private session with an agent costs 10 points
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-yellow-700">Your Balance</div>
              <div className="text-lg font-bold text-yellow-800">
                💰 {user?.points || 0} points
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Prompt for Anonymous Users */}
      {!isAuthenticated && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-center">
          <h4 className="font-medium text-blue-800 mb-2">Want to Customize Your Experience?</h4>
          <p className="text-sm text-blue-700 mb-3">
            Sign in to save favorite agents, earn points, and access premium features
          </p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
            Sign In to Unlock Features
          </button>
        </div>
      )}
    </div>
  );
};