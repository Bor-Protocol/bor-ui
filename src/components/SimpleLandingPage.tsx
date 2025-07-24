import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { AgentSelection } from './AgentSelection';
import { useUserScenes } from '../hooks/useUserScenes';
import { NewStreamConfig } from '../utils/constants';
import { AuthModal } from './AuthModal';

export const SimpleLandingPage: React.FC = () => {
  const { isAuthenticated, user, token, logout } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'agents' | 'dashboard' | 'sessions'>('agents');
  const [showWelcome, setShowWelcome] = useState(false);
  
  // Use socket with authentication token
  const { 
    peerCount, 
    isServerOnline, 
    isAuthenticated: socketAuthenticated, 
    authenticatedUser: socketUser 
  } = useSocket(token);

  // User scenes management
  const {
    selectedAgentId,
    currentScene,
    favoriteScenes,
    recentScenes,
    sessionStats,
    selectAgent,
    toggleFavoriteAgent,
    recordSession,
    isLoading: scenesLoading
  } = useUserScenes();

  const handleAgentSelect = async (agentConfig: NewStreamConfig) => {
    await selectAgent(agentConfig.agentId);
    console.log('Selected agent:', agentConfig.agentId, agentConfig);
    
    // Here you would integrate with the 3D scene system
    // For example, trigger scene change in ScenesContext
  };

  // Show welcome message when user first logs in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">B</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900">BOR Platform</h1>
              <nav className="hidden md:flex items-center space-x-4 ml-8">
                <Link 
                  to="/app" 
                  className="text-sm text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md transition-colors"
                >
                  Live Agents
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                isServerOnline 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isServerOnline ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span>{isServerOnline ? 'Online' : 'Offline'}</span>
                <span className="text-gray-500">({peerCount} users)</span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                    <span className="text-yellow-600">💰</span>
                    <span className="text-sm font-medium">{user?.points || 0}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Welcome, {user?.name || 'User'}!
                    {socketAuthenticated && (
                      <span className="ml-1 text-green-600">✓</span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-2">
                  <button 
                    className="px-4 py-2 text-gray-600 hover:text-gray-900"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Sign In
                  </button>
                  <button 
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    onClick={() => setShowAuthModal(true)}
                  >
                    Get Started
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      {showWelcome && isAuthenticated && (
        <div className="bg-green-50 border-b border-green-200 py-3 px-4 animate-pulse">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-green-800">
              🎉 Welcome {user?.name}! You've been logged in successfully. 
              You have <strong>{user?.points} points</strong> to start your AI journey!
              {socketAuthenticated && <span className="ml-2">✅ Real-time connection active</span>}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900">
            Chat with AI Agents in 
            <span className="text-blue-600"> 3D Virtual Worlds</span>
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Experience the future of AI interaction with lifelike 3D avatars. 
            Join public conversations for free or book private sessions with points.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <button 
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              onClick={() => window.location.href = '/app'}
            >
              Start Free Chat →
            </button>
            <button 
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                } else {
                  setSelectedTab('agents');
                  document.getElementById('agents-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              Select Your Agent ✨
            </button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">🌍</div>
              <h3 className="font-semibold mb-2">Free Public Rooms</h3>
              <p className="text-gray-600 text-sm">
                Join ongoing conversations with AI agents. No signup required for public chats.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">🔒</div>
              <h3 className="font-semibold mb-2">Private Sessions</h3>
              <p className="text-gray-600 text-sm">
                Book 5-minute private sessions with points. Personalized AI interactions just for you.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg border border-gray-200">
              <div className="text-2xl mb-2">💎</div>
              <h3 className="font-semibold mb-2">Points System</h3>
              <p className="text-gray-600 text-sm">
                Get 100 free points on signup. Points regenerate every 24 hours automatically.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4 text-gray-900">Meet Our AI Agents</h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Each agent has their own personality, expertise, and 3D avatar. 
              Start with free public chats or book private sessions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mock Agent Cards */}
            {[
              {
                name: 'Aria',
                description: 'A friendly AI companion who loves to chat about anything and everything.',
                category: 'General',
                viewers: 42,
                rating: 4.8,
                isOnline: true
              },
              {
                name: 'Professor Nova',
                description: 'An AI tutor specialized in science and technology discussions.',
                category: 'Education',
                viewers: 18,
                rating: 4.9,
                isOnline: true
              },
              {
                name: 'Creative Cosmos',
                description: 'An artistic AI that helps with creative projects and inspiration.',
                category: 'Creative',
                viewers: 0,
                rating: 4.7,
                isOnline: false
              }
            ].map((agent, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">
                        {agent.name.charAt(0)}
                      </span>
                    </div>
                    {agent.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{agent.name}</h4>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                        {agent.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        ⭐ {agent.rating}
                      </span>
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between text-sm mb-4">
                  <span className="text-gray-500">
                    👥 {agent.viewers} watching
                  </span>
                  <span className="text-yellow-600">
                    💰 10 points
                  </span>
                </div>

                <div className="flex space-x-2">
                  <button 
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded text-sm hover:bg-gray-50"
                    onClick={() => window.location.href = '/app'}
                  >
                    🌍 Join Chat
                  </button>
                  <button 
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthModal(true);
                      } else {
                        window.location.href = '/app';
                      }
                    }}
                  >
                    🔒 Private Session
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agent Selection Section for Authenticated Users */}
      {isAuthenticated && (
        <section id="agents-section" className="py-16 px-4 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            {/* Navigation Tabs */}
            <div className="flex space-x-1 p-1 bg-white rounded-lg border border-gray-200 mb-8 max-w-md mx-auto">
              {[
                { id: 'agents', label: 'Select Agent', icon: '🤖' },
                { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                { id: 'sessions', label: 'Sessions', icon: '⏰' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedTab === tab.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {selectedTab === 'agents' && (
              <div>
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold mb-2">Select Your AI Agent</h3>
                  <p className="text-gray-600">
                    Choose an agent to start your personalized 3D chat experience
                  </p>
                  {currentScene && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
                      <span className="text-sm text-blue-700">
                        Currently selected: <strong>{currentScene.title}</strong>
                      </span>
                    </div>
                  )}
                </div>
                
                <AgentSelection
                  onAgentSelect={handleAgentSelect}
                  selectedAgentId={selectedAgentId}
                />
              </div>
            )}

            {selectedTab === 'dashboard' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Your Dashboard</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Session Stats */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold mb-4">Session Statistics</h4>
                    {sessionStats ? (
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Sessions:</span>
                          <span className="font-medium">{sessionStats.totalSessions}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Points Spent:</span>
                          <span className="font-medium">{sessionStats.totalPointsSpent}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Favorites:</span>
                          <span className="font-medium">{sessionStats.favoritesCount}</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">No session data yet</p>
                    )}
                  </div>

                  {/* Favorite Agents */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold mb-4">Favorite Agents</h4>
                    {favoriteScenes.length > 0 ? (
                      <div className="space-y-2">
                        {favoriteScenes.slice(0, 3).map((scene) => (
                          <div key={scene.id} className="flex items-center space-x-2">
                            <span className="text-red-500">❤️</span>
                            <span className="text-sm">{scene.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No favorites yet. Add some!</p>
                    )}
                  </div>

                  {/* Recent Agents */}
                  <div className="bg-white p-6 rounded-lg border border-gray-200">
                    <h4 className="font-semibold mb-4">Recently Used</h4>
                    {recentScenes.length > 0 ? (
                      <div className="space-y-2">
                        {recentScenes.slice(0, 3).map((scene) => (
                          <div key={scene.id} className="flex items-center space-x-2">
                            <span className="text-blue-500">🕒</span>
                            <span className="text-sm">{scene.title}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm">No recent activity</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'sessions' && (
              <div>
                <h3 className="text-2xl font-bold mb-6 text-center">Session Management</h3>
                
                <div className="bg-white p-6 rounded-lg border border-gray-200 text-center">
                  <h4 className="font-semibold mb-4">Start Private Session</h4>
                  <p className="text-gray-600 mb-4">
                    Book a 5-minute private session with your selected agent
                  </p>
                  
                  {currentScene ? (
                    <div className="mb-6">
                      <div className="p-4 bg-gray-50 rounded-lg mb-4">
                        <h5 className="font-medium">{currentScene.title}</h5>
                        <p className="text-sm text-gray-600">{currentScene.description}</p>
                      </div>
                      
                      <div className="flex items-center justify-center space-x-4 mb-4">
                        <span className="text-lg">💰 Cost: 10 points</span>
                        <span className="text-lg">⏰ Duration: 5 minutes</span>
                      </div>
                      
                      <button 
                        className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                        onClick={() => recordSession(selectedAgentId, 10)}
                      >
                        Start Private Session (10 points)
                      </button>
                    </div>
                  ) : (
                    <p className="text-gray-500">Please select an agent first</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 BOR Platform. Experience the future of AI interaction.</p>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};