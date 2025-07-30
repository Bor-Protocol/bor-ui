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

// Add custom CSS animations for bubbles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes float-slow {
      0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
      25% { transform: translateY(-20px) translateX(10px) rotate(90deg); }
      50% { transform: translateY(-40px) translateX(-5px) rotate(180deg); }
      75% { transform: translateY(-20px) translateX(-15px) rotate(270deg); }
    }
    
    @keyframes float-medium {
      0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
      33% { transform: translateY(-15px) translateX(15px) rotate(120deg); }
      66% { transform: translateY(-30px) translateX(-10px) rotate(240deg); }
    }
    
    @keyframes float-fast {
      0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
      50% { transform: translateY(-25px) translateX(8px) rotate(180deg); }
    }
    
    @keyframes bubble-rise {
      0% { transform: translateY(100vh) scale(0.5); opacity: 0; }
      10% { opacity: 0.6; }
      90% { opacity: 0.6; }
      100% { transform: translateY(-20vh) scale(1.2); opacity: 0; }
    }
    
    @keyframes glow-pulse {
      0%, 100% { box-shadow: 0 0 20px currentColor; opacity: 0.6; }
      50% { box-shadow: 0 0 40px currentColor; opacity: 0.9; }
    }
    
    .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
    .animate-float-medium { animation: float-medium 6s ease-in-out infinite; }
    .animate-float-fast { animation: float-fast 4s ease-in-out infinite; }
    .animate-bubble-rise { animation: bubble-rise 15s linear infinite; }
    .animate-glow-pulse { animation: glow-pulse 3s ease-in-out infinite; }
    
    .delay-500 { animation-delay: 0.5s; }
    .delay-1000 { animation-delay: 1s; }
    .delay-1500 { animation-delay: 1.5s; }
    .delay-2000 { animation-delay: 2s; }
    .delay-2500 { animation-delay: 2.5s; }
    .delay-3000 { animation-delay: 3s; }
    .delay-3500 { animation-delay: 3.5s; }
    .delay-4000 { animation-delay: 4s; }
    .delay-5000 { animation-delay: 5s; }
    .delay-6000 { animation-delay: 6s; }
    .delay-7000 { animation-delay: 7s; }
    .delay-8000 { animation-delay: 8s; }
  `;
  document.head.appendChild(style);
}

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showBookingConfirm, setShowBookingConfirm] = useState(false);
  const [bookingData, setBookingData] = useState<any>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState<{ type: 'success' | 'error' | 'info', message: string }>({ type: 'info', message: '' });
  
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

  // Show modern notification
  const showModernNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotificationData({ type, message });
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 5000);
  };

  // Handle model booking with new system
  const handleModelBook = async (modelName: string) => {
    try {
      // For premium models, check if user is authenticated first
      const model = models.find(m => m.modelName === modelName);
      
      // If model not found in local list, try to check access
      if (!model) {
        const accessCheck = await checkAccess(modelName);
        
        if (!accessCheck.success) {
          showModernNotification('error', accessCheck.error || 'Cannot access this model');
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
      showModernNotification('error', error.message || 'Failed to book session');
    }
  };

  // Separate function to handle the booking flow after authentication
  const proceedWithBooking = async (modelName: string, modelConfig: any) => {
    try {
      // Now check access with authentication
      const accessCheck = await checkAccess(modelName);
      
      if (!accessCheck.success) {
        if (accessCheck.error === 'Insufficient points') {
          showModernNotification('error', `You need ${accessCheck.required} points but only have ${accessCheck.current}`);
          return;
        }
        showModernNotification('error', accessCheck.error || 'Cannot access this model');
        return;
      }

      // Show modern confirmation dialog
      const config = accessCheck.modelConfig;
      const availability = accessCheck.availability;
      
      setBookingData({
        config,
        availability,
        modelName,
        message: availability && availability.queueLength > 0 
          ? `⚠️ Currently busy! Queue: ${availability.queueLength} people. Estimated wait: ${availability.estimatedWaitMinutes} minutes.`
          : `✅ Available now! Session will start immediately.`
      });
      setShowBookingConfirm(true);
    } catch (error: any) {
      console.error('Error in proceedWithBooking:', error);
      showModernNotification('error', error.message || 'Failed to proceed with booking');
    }
  };

  // Handle confirmed booking
  const handleConfirmedBooking = async () => {
    if (!bookingData) return;
    
    setShowBookingConfirm(false);
    
    try {
      const result = await bookSession(bookingData.modelName);
      
      if (result.success && result.session) {
        if (result.session.status === 'active') {
          showModernNotification('success', `🎉 Session started! Redirecting to ${bookingData.config.displayName}...`);
          setTimeout(() => {
            navigate(result.session.redirectUrl || `/${bookingData.modelName}`);
          }, 1500);
        } else if (result.session.status === 'queued') {
          showModernNotification('info', `Added to queue! Position #${result.session.queuePosition}. You'll be notified when it's your turn.`);
        }
      } else {
        showModernNotification('error', result.error || 'Failed to book session');
      }
    } catch (error: any) {
      showModernNotification('error', error.message || 'Failed to book session');
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
    <div className="min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      {/* Optimized Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 -z-10"></div>
      
      {/* Animated Bubbles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-5">
        {/* Large Floating Bubbles */}
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500/10 rounded-full animate-float-slow"></div>
        <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-purple-500/10 rounded-full animate-float-medium"></div>
        <div className="absolute top-1/2 left-1/3 w-20 h-20 bg-pink-500/10 rounded-full animate-float-fast"></div>
        
        {/* Medium Floating Bubbles */}
        <div className="absolute top-1/3 right-1/3 w-16 h-16 bg-cyan-500/15 rounded-full animate-float-slow delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/2 w-14 h-14 bg-green-500/15 rounded-full animate-float-medium delay-2000"></div>
        <div className="absolute top-2/3 right-1/2 w-18 h-18 bg-yellow-500/15 rounded-full animate-float-fast delay-1500"></div>
        
        {/* Small Floating Bubbles */}
        <div className="absolute top-1/5 right-1/5 w-8 h-8 bg-indigo-500/20 rounded-full animate-float-fast delay-500"></div>
        <div className="absolute bottom-1/3 right-2/3 w-10 h-10 bg-rose-500/20 rounded-full animate-float-medium delay-3000"></div>
        <div className="absolute top-4/5 left-1/5 w-6 h-6 bg-teal-500/20 rounded-full animate-float-slow delay-2500"></div>
        <div className="absolute top-1/6 left-2/3 w-12 h-12 bg-violet-500/15 rounded-full animate-float-medium delay-4000"></div>
        
        {/* Rising Bubbles */}
        <div className="absolute left-1/6 w-6 h-6 bg-blue-400/30 rounded-full animate-bubble-rise delay-1000"></div>
        <div className="absolute left-1/3 w-8 h-8 bg-purple-400/25 rounded-full animate-bubble-rise delay-3000"></div>
        <div className="absolute left-1/2 w-4 h-4 bg-pink-400/35 rounded-full animate-bubble-rise delay-5000"></div>
        <div className="absolute left-2/3 w-7 h-7 bg-cyan-400/30 rounded-full animate-bubble-rise delay-7000"></div>
        <div className="absolute left-5/6 w-5 h-5 bg-green-400/30 rounded-full animate-bubble-rise delay-2000"></div>
        
        {/* Glowing Accent Bubbles */}
        <div className="absolute top-1/2 right-1/6 w-4 h-4 bg-orange-500/25 rounded-full animate-glow-pulse delay-1000"></div>
        <div className="absolute bottom-1/2 left-1/6 w-5 h-5 bg-emerald-500/25 rounded-full animate-glow-pulse delay-3500"></div>
        <div className="absolute top-3/5 left-3/4 w-7 h-7 bg-sky-500/20 rounded-full animate-glow-pulse delay-2000"></div>
      </div>
      
      {/* Header */}
      <header className="relative z-50 bg-slate-900/90 border-b border-white/10" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">B</span>
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"></div>
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
                  ? 'bg-green-900/50 text-green-300 border border-green-500/50' 
                  : 'bg-red-900/50 text-red-300 border border-red-500/50'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isServerOnline ? 'bg-green-400' : 'bg-red-400'
                }`} />
                <span>{isServerOnline ? 'LIVE' : 'Offline'}</span>
                <span className="text-gray-400">•</span>
                <span className="text-white font-semibold">{peerCount}</span>
                <span className="text-gray-400">online</span>
              </div>

              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <div className="bg-black/50 rounded-lg px-3 py-2 border border-white/10">
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
                    className="px-6 py-2.5 bg-black/40 border border-white/20 text-gray-300 hover:text-white rounded-xl font-medium transition-colors duration-200 hover:border-white/40 hover:bg-white/10"
                    onClick={() => setShowAuthModal(true)}
                  >
                    <div className="flex items-center gap-2">
                      <span>🔑</span>
                      Sign In
                    </div>
                  </button>
                  <button 
                    className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors duration-200 font-medium"
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
                    <div className="flex items-center gap-2">
                      <span>🚀</span>
                      Get Started
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
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
        <div className="bg-green-900/30 border-b border-white/10 py-4 px-4">
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
      <section className="relative py-24 px-4">
        {/* Simplified Background Effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-purple-900/20"></div>
        
        {/* Interactive Bubbles in Hero */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-40 h-40 bg-blue-400/5 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-1/3 left-1/3 w-28 h-28 bg-purple-400/8 rounded-full animate-float-medium delay-2000"></div>
          <div className="absolute top-1/2 right-1/2 w-20 h-20 bg-pink-400/6 rounded-full animate-float-fast delay-1000"></div>
        </div>
        
        <div className="relative max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <div className="inline-flex items-center px-4 py-2 bg-black/50 rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
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
              className="group px-8 py-4 bg-red-600 text-white rounded-xl font-bold text-lg hover:bg-red-700 transition-all duration-300 overflow-hidden shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12">
                  <img 
                    src="/avatar/trump-avatar.png" 
                    alt="Trump"
                    className="w-12 h-12 rounded-xl object-cover group-hover:scale-110 transition-transform duration-300 shadow-md"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'block';
                    }}
                  />
                  <span style={{ display: 'none' }}>🇺🇸</span>
                </div>
                Try Trump FREE
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </Link>
            
            <button 
              className="px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg hover:bg-blue-700 transition-colors duration-200"
              onClick={() => navigate('/agents')}
            >
              <div className="flex items-center gap-3">
                🎭 Explore All Agents
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
            
            <button 
              className="px-8 py-4 border-2 border-white/30 text-white rounded-xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-colors duration-200"
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
              <div className="flex items-center gap-3">
                ✨ Premium Access
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </div>
            </button>
          </div>

          {/* Optimized Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <div className="bg-black/50 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors duration-200">
              <div className="text-4xl mb-4">🚀</div>
              <h3 className="text-xl font-bold text-white mb-3">Instant Access</h3>
              <p className="text-gray-300">
                Jump into conversations immediately. No downloads, no setup. Just pure AI interaction.
              </p>
            </div>

            <div className="bg-black/50 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors duration-200">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-white mb-3">Private Sessions</h3>
              <p className="text-gray-300">
                Book exclusive one-on-one time with AI agents. Personalized conversations tailored to you.
              </p>
            </div>

            <div className="bg-black/50 p-8 rounded-2xl border border-white/10 hover:border-white/20 transition-colors duration-200">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold text-white mb-3">Real-time 3D</h3>
              <p className="text-gray-300">
                Watch AI agents react and respond in stunning 3D environments. The future is here.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Video Showcase Section */}
      <section className="relative py-24 px-4 bg-slate-900">
        {/* Enhanced floating bubble elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-pink-500/8 rounded-full animate-float-slow delay-1000"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-cyan-500/10 rounded-full animate-float-medium delay-2500"></div>
          <div className="absolute bottom-20 left-1/3 w-20 h-20 bg-purple-500/8 rounded-full animate-float-fast delay-500"></div>
          <div className="absolute top-1/2 right-1/3 w-16 h-16 bg-yellow-500/6 rounded-full animate-float-medium delay-3000"></div>
          <div className="absolute bottom-1/4 right-1/4 w-12 h-12 bg-green-500/8 rounded-full animate-float-fast delay-1500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-black/50 rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
              Live AI Interaction Demo • Real-time Experience
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              See the Magic in Action
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Watch how our AI agents come to life with real-time 3D interactions, 
              natural conversations, and immersive experiences that blur the line between digital and reality.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="relative group">
              {/* Video container with optimized styling */}
              <div className="relative bg-slate-800 rounded-3xl border border-white/20 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/3 via-transparent to-cyan-500/3"></div>
                
                {/* Real Demo Video */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl overflow-hidden">
                  <video 
                    className="w-full h-full object-cover"
                    controls
                    controlsList="nodownload"
                    poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1920 1080'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%23ec4899;stop-opacity:0.3'/%3E%3Cstop offset='100%25' style='stop-color:%2306b6d4;stop-opacity:0.3'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='100%25' height='100%25' fill='url(%23grad)'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial,sans-serif' font-size='48' fill='white' text-anchor='middle' dy='0.3em'%3E▶ AI Demo%3C/text%3E%3C/svg%3E"
                    preload="metadata"
                    onError={(e) => {
                      console.log('Video error:', e);
                      const target = e.currentTarget as HTMLVideoElement;
                      target.style.display = 'none';
                      const fallback = target.nextElementSibling as HTMLElement;
                      if (fallback) fallback.style.display = 'flex';
                    }}
                    onLoadStart={() => console.log('Video loading started')}
                    onCanPlay={() => console.log('Video can play')}
                  >
                    {/* MP4 format (universal compatibility) */}
                    <source src="/test-demo.mp4" type="video/mp4" />
                    <source src="./test-demo.mp4" type="video/mp4" />
                    
                    Your browser does not support the video tag.
                  </video>
                  
                  {/* Fallback content when video fails */}
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900" style={{ display: 'none' }}>
                    <div className="text-center">
                      <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-pink-500 to-cyan-500 rounded-full flex items-center justify-center animate-pulse">
                        <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-bold text-white mb-2">Demo Video Coming Soon</h3>
                      <p className="text-gray-300 text-sm">Experience real-time conversations with 3D AI agents</p>
                      <p className="text-gray-400 text-xs mt-2">Video file: /test-demo.mp4</p>
                    </div>
                  </div>
                  
                  {/* Video overlay with anime-inspired effects */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-pink-500/5 via-transparent to-cyan-500/5 pointer-events-none"></div>
                  
                  {/* Video Bubbles */}
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-1/4 left-1/4 w-8 h-8 bg-white/10 rounded-full animate-float-fast delay-500"></div>
                    <div className="absolute top-3/4 right-1/4 w-6 h-6 bg-white/8 rounded-full animate-float-medium delay-2000"></div>
                    <div className="absolute bottom-1/3 right-1/3 w-4 h-4 bg-white/12 rounded-full animate-glow-pulse delay-1500"></div>
                  </div>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-4 right-4 flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center rotate-12">
                <span className="text-white text-lg">✨</span>
              </div>
              <div className="absolute -bottom-6 -right-6 w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center -rotate-12">
                <span className="text-white text-lg">🎯</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Step-by-Step Guide Section */}
      <section className="relative py-24 px-4 bg-black">
        {/* Step Guide Bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-22 h-22 bg-purple-400/6 rounded-full animate-float-slow delay-1000"></div>
          <div className="absolute top-2/3 right-1/4 w-18 h-18 bg-blue-400/8 rounded-full animate-float-medium delay-2500"></div>
          <div className="absolute bottom-1/3 left-2/3 w-14 h-14 bg-green-400/7 rounded-full animate-float-fast delay-4000"></div>
          <div className="absolute top-1/2 right-1/5 w-10 h-10 bg-indigo-400/9 rounded-full animate-float-slow delay-500"></div>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-black/50 rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
              Easy Setup • 3 Simple Steps
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-400 via-blue-400 to-indigo-400 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Get started with AI conversations in minutes. Our platform is designed for simplicity without compromising on power.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-purple-500/10 rounded-3xl border border-white/20 p-8 hover:border-white/40 transition-colors duration-200">
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl">🚀</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    1
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Create Account</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Sign up in seconds and get 100 free points to start your AI journey. No credit card required.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mr-2"></span>
                    Instant access
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
                    100 free points
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                    No setup required
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-blue-500/10 rounded-3xl border border-white/20 p-8 hover:border-white/40 transition-colors duration-200">
                <div className="relative">
                  <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    2
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Choose Agent</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Browse our diverse collection of AI agents. From casual chat to professional assistance.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                    Multiple personalities
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-2"></span>
                    Free & premium options
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-indigo-400 rounded-full mr-2"></span>
                    Specialized expertise
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="bg-green-500/10 rounded-3xl border border-white/20 p-8 hover:border-white/40 transition-colors duration-200">
                <div className="relative">
                  <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mb-6">
                    <span className="text-2xl">💬</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    3
                  </div>
                </div>
                <h3 className="text-xl font-bold text-white mb-4">Start Chatting</h3>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Jump into immersive 3D conversations with lifelike AI agents. Experience the future today.
                </p>
                <div className="space-y-2 text-sm text-gray-400">
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                    Real-time 3D interaction
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-2"></span>
                    Natural conversations
                  </div>
                  <div className="flex items-center">
                    <span className="w-2 h-2 bg-teal-400 rounded-full mr-2"></span>
                    Unlimited possibilities
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Call to action */}
          <div className="text-center">
            <button 
              className="px-12 py-4 bg-purple-600 text-white rounded-2xl font-bold text-lg hover:bg-purple-700 transition-colors duration-200"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowAuthModal(true);
                } else {
                  document.getElementById('agents-section')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              <div className="flex items-center gap-3">
                <span>🌟</span>
                Get Started Now
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Feedback & Collaboration Section */}
      <section className="relative py-24 px-4 bg-slate-900">
        {/* Enhanced floating bubble elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-20 w-16 h-16 bg-pink-400/8 rounded-full animate-float-slow delay-2000"></div>
          <div className="absolute top-1/2 right-32 w-12 h-12 bg-cyan-400/10 rounded-full animate-float-medium delay-3500"></div>
          <div className="absolute bottom-1/3 left-1/4 w-14 h-14 bg-purple-400/6 rounded-full animate-float-fast delay-1000"></div>
          <div className="absolute top-1/3 right-1/5 w-10 h-10 bg-emerald-400/8 rounded-full animate-float-slow delay-4000"></div>
          <div className="absolute bottom-1/4 right-2/3 w-8 h-8 bg-orange-400/10 rounded-full animate-float-medium delay-500"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-pink-900/30 rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-pink-400 rounded-full mr-2"></span>
              Community Driven • Open Collaboration
            </div>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 bg-clip-text text-transparent">
              Join Our Mission
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We're building the future of AI interaction together. Share your feedback, contribute ideas, 
              and help shape the next generation of digital conversations.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
            {/* Feedback Section */}
            <div className="bg-pink-900/20 rounded-3xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-pink-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl">💭</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Share Your Feedback</h3>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Your thoughts and suggestions drive our innovation. Help us create better AI experiences 
                by sharing what matters most to you.
              </p>
              
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-pink-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">⭐</span>
                    </div>
                    <span className="text-white font-medium">Feature Requests</span>
                  </div>
                  <p className="text-gray-400 text-sm">Suggest new AI agent capabilities and interactions</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">🐛</span>
                    </div>
                    <span className="text-white font-medium">Bug Reports</span>
                  </div>
                  <p className="text-gray-400 text-sm">Help us improve by reporting issues you encounter</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">💡</span>
                    </div>
                    <span className="text-white font-medium">Ideas & Innovation</span>
                  </div>
                  <p className="text-gray-400 text-sm">Share creative concepts for the future of AI</p>
                </div>
              </div>
              
              <button 
                className="w-full mt-6 py-3 bg-pink-600 text-white rounded-xl font-medium hover:bg-pink-700 transition-colors duration-200"
                onClick={() => setShowFeedbackModal(true)}
              >
                📝 Submit Feedback
              </button>
            </div>

            {/* Collaboration Section */}
            <div className="bg-cyan-900/20 rounded-3xl border border-white/20 p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-cyan-600 rounded-2xl flex items-center justify-center mr-4">
                  <span className="text-xl">🤝</span>
                </div>
                <h3 className="text-2xl font-bold text-white">Collaborate With Us</h3>
              </div>
              
              <p className="text-gray-300 mb-6 leading-relaxed">
                Join our community of developers, designers, and AI enthusiasts. Let's build something 
                amazing together that will change how humans interact with AI.
              </p>
              
              <div className="space-y-4">
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">👨‍💻</span>
                    </div>
                    <span className="text-white font-medium">Developer Program</span>
                  </div>
                  <p className="text-gray-400 text-sm">Build custom AI agents and integrations</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">🎨</span>
                    </div>
                    <span className="text-white font-medium">Design Partnership</span>
                  </div>
                  <p className="text-gray-400 text-sm">Help shape the visual and UX experience</p>
                </div>
                
                <div className="bg-black/30 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mr-3">
                      <span className="text-sm">🚀</span>
                    </div>
                    <span className="text-white font-medium">Beta Program</span>
                  </div>
                  <p className="text-gray-400 text-sm">Early access to new features and agents</p>
                </div>
              </div>
              
              <button 
                className="w-full mt-6 py-3 bg-cyan-600 text-white rounded-xl font-medium hover:bg-cyan-700 transition-colors duration-200"
                onClick={() => window.open('https://discord.gg/bor-platform', '_blank')}
              >
                🌟 Join Community
              </button>
            </div>
          </div>

          {/* Community Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            <div className="text-center bg-purple-900/20 rounded-2xl border border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">1.2K+</div>
              <div className="text-gray-300 text-sm">Active Users</div>
            </div>
            <div className="text-center bg-cyan-900/20 rounded-2xl border border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">250+</div>
              <div className="text-gray-300 text-sm">Feedback Items</div>
            </div>
            <div className="text-center bg-green-900/20 rounded-2xl border border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">48</div>
              <div className="text-gray-300 text-sm">Contributors</div>
            </div>
            <div className="text-center bg-orange-900/20 rounded-2xl border border-white/20 p-6">
              <div className="text-3xl font-bold text-white mb-2">95%</div>
              <div className="text-gray-300 text-sm">Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* AI Agents Showcase */}
      <section id="agents-section" className="relative py-24 px-4 bg-gradient-to-b from-slate-900 to-black">
        {/* Floating Bubbles for Agents Section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/6 left-1/6 w-36 h-36 bg-blue-400/6 rounded-full animate-float-slow delay-1500"></div>
          <div className="absolute top-2/3 right-1/5 w-28 h-28 bg-purple-400/8 rounded-full animate-float-medium delay-3000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-24 h-24 bg-cyan-400/7 rounded-full animate-float-fast delay-500"></div>
          <div className="absolute top-1/3 right-1/3 w-18 h-18 bg-pink-400/9 rounded-full animate-float-slow delay-2500"></div>
          <div className="absolute bottom-1/3 right-1/6 w-14 h-14 bg-green-400/8 rounded-full animate-float-medium delay-4000"></div>
          <div className="absolute top-3/4 left-1/4 w-12 h-12 bg-yellow-400/10 rounded-full animate-float-fast delay-1000"></div>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-white/10 rounded-full border border-white/20 text-sm text-gray-300 mb-6">
              <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
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
              <div className="flex items-center gap-4 bg-black/50 rounded-full px-6 py-3 border border-white/20">
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
                  className={`group relative bg-white/5 rounded-3xl border border-white/20 overflow-hidden transition-all duration-300 hover:border-white/40 flex-shrink-0 ${
                    isCurrentlyActive ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  style={{ width: 'calc(50% - 12px)' }}
                  onMouseEnter={() => setHoveredModel(model.modelName)}
                  onMouseLeave={() => setHoveredModel(null)}
                >
                  {/* Premium Badge */}
                  {!isFree && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">
                        PREMIUM
                      </div>
                    </div>
                  )}

                  {/* Avatar Section */}
                  <div className="relative p-4 text-center">
                    <div className="relative inline-block">
                      {model.displayName === 'Trump AI' ? (
                        <div className="relative">
                          <img 
                            src="/avatar/trump-avatar.png" 
                            alt="Trump AI Avatar"
                            className={`w-40 h-40 rounded-2xl object-cover transition-all duration-300 shadow-lg hover:shadow-2xl ${isHovered ? 'scale-110' : 'scale-100'}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className={`w-40 h-40 rounded-2xl flex items-center justify-center text-6xl font-bold transition-all duration-300 bg-green-600 text-white ${isHovered ? 'scale-110' : 'scale-100'}`} style={{ display: 'none' }}>
                            🇺🇸
                          </div>
                        </div>
                      ) : model.displayName === 'Borp AI' ? (
                        <div className="relative">
                          <img 
                            src="/avatar/bor-avatar.png" 
                            alt="Borp AI Avatar"
                            className={`w-40 h-40 rounded-2xl object-cover transition-all duration-300 shadow-lg hover:shadow-2xl ${isHovered ? 'scale-110' : 'scale-100'}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className={`w-40 h-40 rounded-2xl flex items-center justify-center text-6xl font-bold transition-all duration-300 bg-blue-600 text-white ${isHovered ? 'scale-110' : 'scale-100'}`} style={{ display: 'none' }}>
                            🤖
                          </div>
                        </div>
                      ) : model.displayName === 'Agent Alpha' ? (
                        <div className="relative">
                          <img 
                            src="/avatar/naruto-avatar.png" 
                            alt="Agent Alpha - Naruto"
                            className={`w-40 h-40 rounded-2xl object-cover transition-all duration-300 shadow-lg hover:shadow-2xl ${isHovered ? 'scale-110' : 'scale-100'}`}
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              const fallback = target.nextElementSibling as HTMLElement;
                              if (fallback) fallback.style.display = 'flex';
                            }}
                          />
                          <div className={`w-40 h-40 rounded-2xl flex items-center justify-center text-6xl font-bold transition-all duration-300 bg-blue-600 text-white ${isHovered ? 'scale-110' : 'scale-100'}`} style={{ display: 'none' }}>
                            ⚡
                          </div>
                        </div>
                      ) : (
                        <div className={`w-40 h-40 rounded-2xl flex items-center justify-center text-6xl font-bold transition-all duration-300 shadow-lg hover:shadow-2xl ${
                          isFree 
                            ? 'bg-green-600 text-white' 
                            : 'bg-blue-600 text-white'
                        } ${isHovered ? 'scale-110' : 'scale-100'}`}>
                          {model.displayName.charAt(0)}
                        </div>
                      )}
                      <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-400 border-3 border-white rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white mt-3 mb-2">
                      {model.displayName}
                    </h3>
                    
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isFree 
                          ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                          : 'bg-purple-900/50 text-purple-300 border border-purple-500/30'
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
                    <div className="bg-black/50 rounded-lg p-3 mb-4 space-y-2">
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
                      <div className="bg-blue-900/30 border border-blue-500/30 rounded-lg p-3 mb-4">
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
                          className="w-3/4 py-3 bg-green-600 text-white rounded-lg font-bold text-sm hover:bg-green-700 transition-colors duration-200"
                          onClick={() => navigate(`/${model.modelName}`)}
                        >
                          🌍 Start Free Session
                        </button>
                      ) : (
                        <div className="space-y-2 w-full">
                          {!isAuthenticated ? (
                            <div className="bg-yellow-900/30 border border-yellow-500/30 rounded-lg p-2 mb-2">
                              <p className="text-xs text-yellow-300 text-center mb-2">
                                🔐 Private sessions require an account
                              </p>
                              <p className="text-xs text-gray-300 text-center">
                                Sign up for free to unlock premium features
                              </p>
                            </div>
                          ) : currentSession && !isCurrentlyActive && (
                            <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-2 mb-2">
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
                              className={`w-3/4 py-3 rounded-lg font-bold text-sm transition-colors duration-200 relative group ${
                                isCurrentlyActive
                                  ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                  : currentSession && !isCurrentlyActive
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                                  : 'bg-purple-600 text-white hover:bg-purple-700'
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
                  <div className={`absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none rounded-3xl`}></div>
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
          {/* Dashboard Bubbles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/5 right-1/4 w-26 h-26 bg-yellow-400/6 rounded-full animate-float-slow delay-2000"></div>
            <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-blue-400/8 rounded-full animate-float-medium delay-3500"></div>
            <div className="absolute top-1/2 left-1/6 w-16 h-16 bg-green-400/7 rounded-full animate-float-fast delay-1500"></div>
          </div>
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
              <div className="mb-12 p-8 bg-blue-900/20 border border-white/20 rounded-3xl max-w-4xl mx-auto">
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
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors duration-200"
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
              <div className="bg-yellow-900/20 border border-white/20 rounded-3xl p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">💰</div>
                  <h4 className="text-xl font-bold text-white mb-4">Your Balance</h4>
                  <PointsDisplay showDetails={true} />
                </div>
              </div>
              
              {/* Usage Statistics */}
              <div className="bg-blue-900/20 border border-white/20 rounded-3xl p-8">
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
              <div className="bg-green-900/20 border border-white/20 rounded-3xl p-8">
                <div className="text-center">
                  <div className="text-4xl mb-4">🚀</div>
                  <h4 className="text-xl font-bold text-white mb-4">Quick Launch</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/trump')}
                      className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 transition-all duration-300 group shadow-lg hover:shadow-xl"
                    >
                      <div className="flex items-center justify-center gap-3">
                        <img 
                          src="/avatar/trump-avatar.png" 
                          alt="Trump"
                          className="w-8 h-8 rounded-lg object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'inline';
                          }}
                        />
                        <span style={{ display: 'none' }}>🇺🇸</span>
                        Trump (Free)
                      </div>
                    </button>
                    <button
                      onClick={() => handleModelBook('borp')}
                      className="w-full px-4 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200 group"
                      disabled={!!currentSession}
                    >
                      <div className="flex items-center justify-center gap-3">
                        <img 
                          src="/avatar/bor-avatar.png" 
                          alt="Borp"
                          className="w-8 h-8 rounded-lg object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.style.display = 'none';
                            const fallback = target.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'inline';
                          }}
                        />
                        <span style={{ display: 'none' }}>🤖</span>
                        Book Borp
                      </div>
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
        {/* Footer Bubbles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/5 w-20 h-20 bg-blue-400/5 rounded-full animate-float-slow delay-2000"></div>
          <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-purple-400/6 rounded-full animate-float-medium delay-4000"></div>
          <div className="absolute bottom-1/4 left-1/2 w-12 h-12 bg-cyan-400/7 rounded-full animate-float-fast delay-1000"></div>
          <div className="absolute top-2/3 right-1/3 w-8 h-8 bg-green-400/8 rounded-full animate-glow-pulse delay-3000"></div>
        </div>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
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
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
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
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
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

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowFeedbackModal(false);
            }
          }}
        >
          <div className="bg-slate-900 rounded-2xl w-full max-w-md border border-white/20 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="relative p-6 border-b border-white/10">
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors"
                type="button"
              >
                ×
              </button>
              
              <div className="text-center pr-8">
                <div className="w-12 h-12 mx-auto mb-3 bg-pink-600 rounded-xl flex items-center justify-center text-xl">
                  💭
                </div>
                <h2 className="text-xl font-bold text-white mb-1">
                  Share Your Feedback
                </h2>
                <p className="text-sm text-gray-300">
                  Help us improve by sharing your thoughts
                </p>
              </div>
            </div>

            <div className="p-6">
              <form onSubmit={(e) => {
                e.preventDefault();
                // For now, we'll use mailto. In production, you'd want to use a proper API
                const form = e.target as HTMLFormElement;
                const type = form.feedbackType.value;
                const message = form.message.value;
                const email = form.email?.value || 'Not provided';
                
                const subject = `BOR Platform Feedback: ${type}`;
                const body = `Type: ${type}\n\nMessage:\n${message}\n\nFrom: ${email}`;
                
                window.location.href = `mailto:feedback@bor-platform.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                setShowFeedbackModal(false);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Feedback Type
                    </label>
                    <select 
                      name="feedbackType"
                      required
                      className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white"
                    >
                      <option value="feature-request">Feature Request</option>
                      <option value="bug-report">Bug Report</option>
                      <option value="improvement">Improvement Suggestion</option>
                      <option value="general">General Feedback</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Your Message
                    </label>
                    <textarea 
                      name="message"
                      required
                      rows={4}
                      className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400 resize-none"
                      placeholder="Tell us what's on your mind..."
                    />
                  </div>

                  <div>
                    <label className="block text-white text-sm font-medium mb-2">
                      Email (Optional)
                    </label>
                    <input 
                      type="email"
                      name="email"
                      className="w-full px-3 py-2 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-white placeholder-gray-400"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="mt-6 flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 py-3 bg-pink-600 text-white rounded-lg font-medium hover:bg-pink-700 transition-colors duration-200"
                  >
                    Send Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowFeedbackModal(false)}
                    className="flex-1 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>

              <div className="mt-4 text-center text-xs text-gray-400">
                Or reach us directly at feedback@bor-platform.com
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Booking Confirmation Modal */}
      {showBookingConfirm && bookingData && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md animate-slideUpAndScale max-w-md w-full">
            <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-2xl p-1">
              <div className="bg-slate-900/95 rounded-2xl p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl">
                    🤖
                  </div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent mb-2">
                    Book Private Session
                  </h3>
                  <p className="text-slate-300 text-sm">
                    {bookingData.config.displayName}
                  </p>
                </div>

                <div className="space-y-4 mb-6">
                  <div className="rounded-xl border border-white/10 p-4 bg-slate-800/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-slate-300">💰 Cost</span>
                      <span className="text-white font-bold">{bookingData.config.pointsCost} points</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-300">⏱️ Duration</span>
                      <span className="text-white font-bold">{bookingData.config.sessionDurationMinutes} minutes</span>
                    </div>
                  </div>

                  <div className="rounded-xl border border-blue-500/30 p-4 bg-blue-500/10">
                    <p className="text-blue-200 text-sm font-medium">
                      {bookingData.message}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowBookingConfirm(false)}
                    className="flex-1 py-3 px-4 rounded-xl bg-slate-700 text-white font-medium hover:bg-slate-600 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConfirmedBooking}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    🚀 Book Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modern Notification */}
      {showNotification && (
        <div className="fixed top-20 right-4 z-[110] animate-slideUpAndScale">
          <div className="rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md max-w-sm">
            <div className={`bg-gradient-to-r rounded-2xl p-1 ${
              notificationData.type === 'success' ? 'from-green-500/20 via-emerald-500/20 to-green-500/20' :
              notificationData.type === 'error' ? 'from-red-500/20 via-pink-500/20 to-red-500/20' :
              'from-blue-500/20 via-purple-500/20 to-blue-500/20'
            }`}>
              <div className="bg-slate-900/95 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className={`w-2 h-2 rounded-full mt-2 animate-pulse ${
                    notificationData.type === 'success' ? 'bg-green-400' :
                    notificationData.type === 'error' ? 'bg-red-400' :
                    'bg-blue-400'
                  }`}></div>
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      notificationData.type === 'success' ? 'text-green-200' :
                      notificationData.type === 'error' ? 'text-red-200' :
                      'text-blue-200'
                    }`}>
                      {notificationData.message}
                    </p>
                  </div>
                  <button
                    onClick={() => setShowNotification(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};