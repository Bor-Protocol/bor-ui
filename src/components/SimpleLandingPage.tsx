import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { NewStreamConfig, FREE_MODEL_AGENT_ID } from '../utils/constants';
import { AuthModal } from './AuthModal';
import { BookingAuthModal } from './BookingAuthModal';
import { PointsDisplay } from './PointsDisplay';
import { useNavigate } from 'react-router-dom';
import { useSessionBooking } from '../hooks/useSessionBooking';

export const SimpleLandingPage: React.FC = () => {
  const { isAuthenticated, user, token, logout } = useAuth();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showBookingAuthModal, setShowBookingAuthModal] = useState(false);
  const [selectedModelForBooking, setSelectedModelForBooking] = useState<any>(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  
  // New session booking system
  const { 
    models, 
    currentSession, 
    bookSession, 
    checkAccess, 
    isLoading: sessionLoading 
  } = useSessionBooking();
  
  // Use socket with authentication token
  const { 
    peerCount, 
    isServerOnline, 
    isAuthenticated: socketAuthenticated, 
    authenticatedUser: socketUser 
  } = useSocket(token);

  // Mock session stats for now - could be enhanced later
  const sessionStats: { totalSessions: number; totalPointsSpent: number } | null = null;

  // Handle model booking with new system
  const handleModelBook = async (modelName: string) => {
    try {
      // For premium models, check if user is authenticated first
      const model = models.find(m => m.modelName === modelName);
      
      // If model not found in local list, try to check access
      if (!model) {
        const accessCheck = await checkAccess(modelName);
        
        if (!accessCheck.success) {
          alert(accessCheck.error || 'Cannot access this model');
          return;
        }

        // For free models, redirect directly
        if (accessCheck.modelConfig.accessType === 'free') {
          navigate(`/${modelName}`);
          return;
        }

        // For premium models, require authentication
        if (!isAuthenticated) {
          setSelectedModelForBooking(accessCheck.modelConfig);
          setShowBookingAuthModal(true);
          return;
        }

        // Continue with the booking flow...
        await proceedWithBooking(modelName, accessCheck.modelConfig);
        return;
      }

      // For free models, redirect directly
      if (model.accessType === 'free') {
        navigate(`/${modelName}`);
        return;
      }

      // For premium models, require authentication first
      if (!isAuthenticated) {
        setSelectedModelForBooking(model);
        setShowBookingAuthModal(true);
        return;
      }

      // User is authenticated, now check access and proceed
      await proceedWithBooking(modelName, model);
    } catch (error: any) {
      console.error('Error in handleModelBook:', error);
      alert(error.message || 'Failed to book session');
    }
  };

  // Separate function to handle the booking flow after authentication
  const proceedWithBooking = async (modelName: string, modelConfig: any) => {
    try {
      // Now check access with authentication
      const accessCheck = await checkAccess(modelName);
      
      if (!accessCheck.success) {
        if (accessCheck.error === 'Insufficient points') {
          alert(`You need ${accessCheck.required} points but only have ${accessCheck.current}`);
          return;
        }
        alert(accessCheck.error || 'Cannot access this model');
        return;
      }

      // Show confirmation dialog
      const config = accessCheck.modelConfig;
      const availability = accessCheck.availability;
      
      let message = `Book private session with ${config.displayName}?\n\n`;
      message += `Cost: ${config.pointsCost} points\n`;
      message += `Duration: ${config.sessionDurationMinutes} minutes\n\n`;
      
      if (availability && availability.queueLength > 0) {
        message += `⚠️ Currently busy!\n`;
        message += `Queue: ${availability.queueLength} people\n`;
        message += `Estimated wait: ${availability.estimatedWaitMinutes} minutes\n\n`;
        message += `You will be added to the queue. Proceed?`;
      } else {
        message += `✅ Available now! Session will start immediately.`;
      }

      if (confirm(message)) {
        const result = await bookSession(modelName);
        
        if (result.success && result.session) {
          if (result.session.status === 'active') {
            // Redirect to model page with session
            navigate(result.session.redirectUrl || `/${modelName}`);
          } else if (result.session.status === 'queued') {
            alert(`Added to queue! Position #${result.session.queuePosition}. You'll be notified when it's your turn.`);
          }
        } else {
          alert(result.error || 'Failed to book session');
        }
      }
    } catch (error: any) {
      console.error('Error in proceedWithBooking:', error);
      alert(error.message || 'Failed to proceed with booking');
    }
  };

  // Show welcome message when user first logs in
  React.useEffect(() => {
    if (isAuthenticated && user) {
      setShowWelcome(true);
      const timer = setTimeout(() => setShowWelcome(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  // Request updated peer count on component mount
  React.useEffect(() => {
    // Small delay to ensure socket is connected
    const timer = setTimeout(() => {
      if (window.socket?.connected) {
        window.socket.emit('request_peer_count');
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Update current time every second for live feel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BOR Platform</h1>
                <p className="text-xs text-gray-300">Live AI Interaction Hub</p>
              </div>
              <nav className="hidden md:flex items-center space-x-6 ml-8">
                <Link 
                  to="/free-agents" 
                  className="text-sm text-gray-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-all duration-200"
                >
                  🌍 Free Live Agents
                </Link>
                <div className="text-sm text-gray-400">
                  🔴 LIVE • {currentTime.toLocaleTimeString()}
                </div>
              </nav>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Enhanced Connection Status */}
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-full text-xs font-medium ${
                isServerOnline 
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isServerOnline ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                }`} />
                <span>{isServerOnline ? 'LIVE' : 'Offline'}</span>
                <span className="text-gray-400">•</span>
                <span className="text-white font-semibold">{peerCount}</span>
                <span className="text-gray-400">online</span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="bg-black/30 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/10">
                    <PointsDisplay />
                  </div>
                  <div className="text-sm font-medium text-white">
                    <span className="text-gray-300">Welcome,</span> {user?.name || 'User'}
                    {socketAuthenticated && (
                      <span className="ml-2 text-green-400">●</span>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="px-4 py-2 text-sm text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-white/10 transition-all duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex space-x-3">
                  <button 
                    className="group relative px-6 py-2.5 bg-black/20 backdrop-blur-sm border border-white/20 text-gray-300 hover:text-white rounded-xl font-medium transition-all duration-200 hover:border-white/40 hover:bg-white/10 overflow-hidden"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex items-center gap-2">
                      <span>🔑</span>
                      Sign In
                    </div>
                  </button>
                  <button 
                    className="group relative px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg font-medium transform hover:scale-105 overflow-hidden"
                    onClick={() => {
                      setShowAuthModal(true);
                      // Smooth scroll to agents section after a brief delay
                      setTimeout(() => {
                        document.getElementById('agents-section')?.scrollIntoView({ 
                          behavior: 'smooth',
                          block: 'start'
                        });
                      }, 100);
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    <div className="relative flex items-center gap-2">
                      <span>🚀</span>
                      Get Started
                      <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Welcome Banner */}
      {showWelcome && isAuthenticated && (
        <div className="bg-gradient-to-r from-green-500/20 to-blue-500/20 border-b border-white/10 py-4 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-white">
              🎉 Welcome back, <span className="font-bold text-green-400">{user?.name}</span>! 
              You have <span className="font-bold text-yellow-400">{user?.points} points</span> ready to use.
              {socketAuthenticated && <span className="ml-2 text-green-400">✅ Connected</span>}
            </p>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative py-24 px-4 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width=%2260%22%20height=%2260%22%20viewBox=%220%200%2060%2060%22%20xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cg%20fill=%22none%22%20fill-rule=%22evenodd%22%3E%3Cg%20fill=%22%239C92AC%22%20fill-opacity=%220.1%22%3E%3Ccircle%20cx=%2230%22%20cy=%2230%22%20r=%221%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Live AI Agents • Real-time Interaction • 3D Experience
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent leading-tight">
            The Future of AI
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Conversation is Here
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed">
            Experience groundbreaking AI interactions with lifelike 3D avatars. 
            <br className="hidden md:block" />
            Join millions discovering the next generation of digital conversation.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
            <Link 
              to="/trump"
              className="group relative px-8 py-4 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold text-lg hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-2xl"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-400 to-red-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                🇺🇸 Try Trump FREE
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
            
            <button 
              className="group relative px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-2xl"
              onClick={() => navigate('/agents')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
              <div className="relative flex items-center gap-3">
                🎭 Explore All Agents
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            <button 
              className="group relative px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-200 transform hover:scale-105 overflow-hidden"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                  // Smooth scroll to agents section after auth modal opens
                  setTimeout(() => {
                    document.getElementById('agents-section')?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    });
                  }, 300);
                } else {
                  document.getElementById('agents-section')?.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                  });
                }
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              <div className="relative flex items-center gap-3">
                ✨ Premium Access
                <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </button>
          </div>

          {/* Enhanced Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="group bg-black/20 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🚀</div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Access</h3>
              <p className="text-gray-300">
                Jump into conversations immediately. No downloads, no setup. Just pure AI interaction.
              </p>
            </div>

            <div className="group bg-black/20 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Private Sessions</h3>
              <p className="text-gray-300">
                Book exclusive one-on-one time with AI agents. Personalized conversations tailored to you.
              </p>
            </div>

            <div className="group bg-black/20 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time 3D</h3>
              <p className="text-gray-300">
                Watch AI agents react and respond in stunning 3D environments. The future is here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section id="agents-section" className="relative py-24 px-4 bg-gradient-to-b from-slate-900 to-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2 animate-pulse"></span>
              {peerCount} users currently online
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Choose Your AI Agent
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Each agent brings unique personality, expertise, and conversation style. 
              Start with free interactions or book exclusive private sessions.
            </p>
          </div>

          {/* Carousel Container */}
          <div className="relative max-w-6xl mx-auto">
            {/* Carousel Navigation */}
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-4 bg-black/20 backdrop-blur-sm rounded-full px-6 py-3 border border-white/20">
                <button
                  onClick={() => setCarouselIndex(Math.max(0, carouselIndex - 2))}
                  disabled={carouselIndex === 0}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all duration-200"
                >
                  ←
                </button>
                <span className="text-white font-medium">
                  {Math.floor(carouselIndex / 2) + 1} / {Math.ceil(models.length / 2)}
                </span>
                <button
                  onClick={() => setCarouselIndex(Math.min(models.length - 2, carouselIndex + 2))}
                  disabled={carouselIndex >= models.length - 2}
                  className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-white transition-all duration-200"
                >
                  →
                </button>
              </div>
            </div>

            {/* Carousel Cards */}
            <div className="overflow-hidden px-4">
              <div 
                className="flex transition-transform duration-500 ease-in-out gap-6"
                style={{ transform: `translateX(-${carouselIndex * 50}%)` }}
              >
                {models.map((model) => {
              const isCurrentlyActive = currentSession && model.modelName === currentSession.modelName;
              const isFree = model.accessType === 'free';
              const isHovered = hoveredModel === model.modelName;
              
              return (
                <div 
                  key={model.modelName} 
                  className={`group relative bg-gradient-to-b from-white/10 to-white/5 backdrop-blur-sm rounded-3xl border border-white/20 overflow-hidden transition-all duration-500 hover:transform hover:scale-105 hover:border-white/40 flex-shrink-0 ${
                    isCurrentlyActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  style={{ width: 'calc(50% - 12px)' }}
                  onMouseEnter={() => setHoveredModel(model.modelName)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  {/* Premium Badge */}
                  {!isFree && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        PREMIUM
                      </div>
                    </div>
                  )}

                  {/* Avatar Section */}
                  <div className="relative p-4 text-center">
                    <div className="relative inline-block">
                      <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-bold transition-all duration-300 ${
                        isFree 
                          ? 'bg-gradient-to-br from-green-400 to-green-600 text-white' 
                          : 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                      } ${isHovered ? 'scale-110 rotate-3' : ''}`}>
                        {model.displayName === 'Trump AI' ? '🇺🇸' : 
                         model.displayName === 'Borp AI' ? '🤖' : 
                         model.displayName === 'Agent Alpha' ? '⚡' : 
                         model.displayName.charAt(0)}
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full animate-pulse"></div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mt-3 mb-2">
                      {model.displayName}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isFree 
                          ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}>
                        {isFree ? '🌍 FREE' : `💎 ${model.pointsCost}pts`}
                      </span>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="px-4 pb-4">
                    <p className="text-gray-300 text-center mb-4 leading-relaxed text-sm">
                      {model.displayName === 'Trump AI' ? 'Dynamic political conversations. Unlimited free access.' :
                       model.displayName === 'Borp AI' ? 'Friendly AI companion with deep knowledge and engaging personality.' :
                       model.displayName === 'Agent Alpha' ? 'Advanced AI specialized in technical topics and problem-solving.' :
                       model.description || `Experience ${model.displayName} in AI conversations.`}
                    </p>

                    {/* Session Info */}
                    <div className="bg-black/30 rounded-lg p-3 mb-4 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-gray-400">Duration:</span>
                        <span className="text-white font-medium">
                          {model.sessionDurationMinutes === 0 ? '∞ Unlimited' : `⏱️ ${model.sessionDurationMinutes}min`}
                        </span>
                      </div>
                      {!isFree && (
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-400">Cost:</span>
                          <span className="text-yellow-400 font-medium">💰 {model.pointsCost} points</span>
                        </div>
                      )}
                    </div>

                    {/* Current Session Status */}
                    {isCurrentlyActive && (
                      <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-3 mb-4">
                        <div className="text-center">
                          <div className="text-blue-300 font-medium mb-1 text-sm">🎮 Active Session</div>
                          <div className="text-xs text-gray-300">
                            Status: <span className="text-green-400 font-medium">{currentSession.status}</span>
                          </div>
                          {currentSession.endTime && (
                            <div className="text-xs text-gray-400 mt-1">
                              Ends: {new Date(currentSession.endTime).toLocaleTimeString()}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 flex flex-col items-center">
                      {isFree ? (
                        <button 
                          className="w-3/4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold text-sm hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                          onClick={() => navigate(`/${model.modelName}`)}
                        >
                          🌍 Start Free Session
                        </button>
                      ) : (
                        <div className="space-y-2 w-full">
                          {!isAuthenticated ? (
                            <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg p-2 mb-2">
                              <p className="text-xs text-yellow-300 text-center mb-2">
                                🔐 Private sessions require an account
                              </p>
                              <p className="text-xs text-gray-300 text-center">
                                Sign up for free to unlock premium features
                              </p>
                            </div>
                          ) : currentSession && !isCurrentlyActive && (
                            <div className="bg-gradient-to-r from-red-500/20 to-pink-500/20 border border-red-500/30 rounded-lg p-2 mb-2">
                              <p className="text-xs text-red-300 text-center mb-1">
                                ⏳ Active session with another agent
                              </p>
                              <p className="text-xs text-gray-300 text-center">
                                Complete current session first
                              </p>
                            </div>
                          )}
                          
                          <div className="flex justify-center">
                            <button 
                              className={`w-3/4 py-3 rounded-lg font-bold text-sm transition-all duration-200 transform hover:scale-105 shadow-lg relative group ${
                                isCurrentlyActive
                                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700' 
                                  : currentSession && !isCurrentlyActive
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                  : 'bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:from-purple-600 hover:to-purple-700'
                              }`}
                              disabled={currentSession && !isCurrentlyActive}
                              onClick={() => {
                                if (isCurrentlyActive) {
                                  navigate(`/${model.modelName}?session=${currentSession.id}`);
                                } else {
                                  handleModelBook(model.modelName);
                                }
                              }}
                            >
                              {isCurrentlyActive 
                                ? '🎮 Continue Session' 
                                : currentSession && !isCurrentlyActive
                                ? '🔒 Currently Busy' 
                                : '💎 Book Session'
                              }
                              
                              {/* Tooltip for non-authenticated users */}
                              {!isAuthenticated && (
                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                  Create account • Get 100 free points • Book instantly
                                </div>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Hover Effect Overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none rounded-3xl`}></div>
                </div>
              );
            })}
              </div>
            </div>

            {/* Carousel Dots */}
            <div className="flex justify-center mt-8 gap-2">
              {Array.from({ length: Math.ceil(models.length / 2) }, (_, index) => (
                <button
                  key={index}
                  onClick={() => setCarouselIndex(index * 2)}
                  className={`w-3 h-3 rounded-full transition-all duration-200 ${
                    Math.floor(carouselIndex / 2) === index 
                      ? 'bg-white shadow-lg' 
                      : 'bg-white/30 hover:bg-white/50'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Dashboard for Authenticated Users */}
      {isAuthenticated && (
        <section id="dashboard-section" className="py-24 px-4 bg-gradient-to-b from-black to-slate-900">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h3 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                Welcome back, {user?.name}
              </h3>
              <p className="text-xl text-gray-300 max-w-2xl mx-auto">
                Your personal AI interaction hub. Manage sessions, track usage, and discover new agents.
              </p>
            </div>

            {/* Enhanced Current Session Status */}
            {currentSession && (
              <div className="mb-12 p-8 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-3xl max-w-4xl mx-auto">
                <div className="text-center">
                  <h4 className="text-2xl font-bold text-white mb-4">🎮 Active Session</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400 mb-2">
                        {currentSession.status === 'active' ? 'LIVE' : 'QUEUED'}
                      </p>
                      <p className="text-gray-300 text-sm">
                        {currentSession.status === 'queued' && currentSession.queuePosition && 
                          `Position #${currentSession.queuePosition}`
                        }
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-medium text-lg">
                        {currentSession.modelName || 'Agent'}
                      </p>
                      {currentSession.endTime && (
                        <p className="text-gray-400 text-sm">
                          Ends: {new Date(currentSession.endTime).toLocaleTimeString()}
                        </p>
                      )}
                    </div>
                    <div>
                      <button
                        onClick={() => navigate(`/${currentSession.modelName || 'borp'}?session=${currentSession.id}`)}
                        className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
                      >
                        Continue Session →
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Enhanced Points Display */}
              <div className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h4 className="text-xl font-bold text-white mb-4">Your Balance</h4>
                  <PointsDisplay showDetails={true} />
                </div>
              </div>
              
              {/* Usage Statistics */}
              <div className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">📊</div>
                  <h4 className="text-xl font-bold text-white mb-4">Usage Stats</h4>
                  {sessionStats ? (
                    <div className="space-y-3">
                      <div className="flex justify-between text-gray-300">
                        <span>Sessions:</span>
                        <span className="text-white font-bold">{sessionStats.totalSessions}</span>
                      </div>
                      <div className="flex justify-between text-gray-300">
                        <span>Points Used:</span>
                        <span className="text-yellow-400 font-bold">{sessionStats.totalPointsSpent}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-400">Start your first session to see stats</p>
                  )}
                </div>
              </div>

              {/* Quick Launch */}
              <div className="bg-gradient-to-br from-green-500/20 to-blue-500/20 backdrop-blur-sm border border-white/20 rounded-3xl p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h4 className="text-xl font-bold text-white mb-4">Quick Launch</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/trump')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200"
                    >
                      🇺🇸 Trump (Free)
                    </button>
                    <button
                      onClick={() => handleModelBook('borp')}
                      className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-200"
                      disabled={!!currentSession}
                    >
                      🤖 Book Borp
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Professional Footer */}
      <footer className="relative py-16 px-4 bg-black border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-xl">B</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">BOR Platform</h3>
                  <p className="text-gray-400 text-sm">The Future of AI Conversation</p>
                </div>
              </div>
              <p className="text-gray-300 max-w-md leading-relaxed">
                Experience the next generation of AI interaction with immersive 3D avatars, 
                real-time conversations, and personalized experiences.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4">Platform</h4>
              <ul className="space-y-2">
                <li><Link to="/trump" className="text-gray-400 hover:text-white transition-colors">Free Chat</Link></li>
                <li><Link to="/app" className="text-gray-400 hover:text-white transition-colors">All Agents</Link></li>
                <li><button onClick={() => setShowAuthModal(true)} className="text-gray-400 hover:text-white transition-colors">Sign Up</button></li>
              </ul>
            </div>

            {/* Stats */}
            <div>
              <h4 className="text-white font-semibold mb-4">Live Stats</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-gray-400">{peerCount} users online</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span className="text-gray-400">3 AI agents available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span className="text-gray-400">Real-time 3D interaction</span>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <p className="text-gray-400 text-sm">
                &copy; 2024 BOR Platform. All rights reserved. Built with cutting-edge AI technology.
              </p>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                  <span>All systems operational</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Authentication Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />

      {/* Booking Authentication Modal */}
      <BookingAuthModal 
        isOpen={showBookingAuthModal}
        onClose={() => {
          setShowBookingAuthModal(false);
          setSelectedModelForBooking(null);
        }}
        onSuccess={() => {
          setShowBookingAuthModal(false);
          // After successful auth, proceed with booking
          if (selectedModelForBooking) {
            proceedWithBooking(selectedModelForBooking.modelName, selectedModelForBooking);
          }
          setSelectedModelForBooking(null);
        }}
        modelConfig={selectedModelForBooking}
      />
    </div>
  );
};