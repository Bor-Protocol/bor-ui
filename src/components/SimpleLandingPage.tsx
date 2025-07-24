import React, { useState } from 'react';
import { useAuth } from '../contexts/SimpleAuthContext';

export const SimpleLandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

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
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                    <span className="text-yellow-600">💰</span>
                    <span className="text-sm font-medium">{user?.points || 0}</span>
                  </div>
                  <div className="text-sm font-medium text-gray-700">
                    Welcome, {user?.name || 'User'}!
                  </div>
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
            <button className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
              Watch Demo ▶
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
                    onClick={() => window.location.href = `/agent/${index + 1}/public`}
                  >
                    🌍 Free Chat
                  </button>
                  <button 
                    className="flex-1 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    onClick={() => {
                      if (!isAuthenticated) {
                        setShowAuthModal(true);
                      } else {
                        window.location.href = `/agent/${index + 1}/private`;
                      }
                    }}
                  >
                    🔒 Private
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-8 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto text-center text-gray-600">
          <p>&copy; 2024 BOR Platform. Experience the future of AI interaction.</p>
        </div>
      </footer>

      {/* Simple Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Authentication Required</h3>
            <p className="text-gray-600 mb-4">
              Sign in to access private sessions and earn points!
            </p>
            <div className="flex space-x-3">
              <button 
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                onClick={() => setShowAuthModal(false)}
              >
                Cancel
              </button>
              <button 
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => {
                  setShowAuthModal(false);
                  // Implement actual auth logic here
                }}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};