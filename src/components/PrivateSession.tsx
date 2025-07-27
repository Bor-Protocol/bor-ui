import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useParams } from 'react-router-dom';

interface SessionData {
  id: string;
  agentId: string;
  status: 'active' | 'queued';
  queuePosition?: number;
  estimatedWaitMinutes?: number;
  remainingTimeSeconds?: number;
  startTime?: string;
  endTime?: string;
}

interface AgentAvailability {
  isAvailable: boolean;
  queueLength: number;
  estimatedWaitTime: number;
  remainingTimeSeconds?: number;
  currentSession?: {
    name: string;
    email: string;
    startTime: string;
    endTime: string;
    remainingSeconds: number;
  } | null;
  queueDetails?: Array<{
    position: number;
    userId: string;
    userName: string;
    userEmail: string;
    addedAt: string;
    estimatedStartTime: string;
  }>;
}

export const PrivateSession: React.FC = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { agentId } = useParams<{ agentId: string }>();
  
  const [session, setSession] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [agentAvailability, setAgentAvailability] = useState<AgentAvailability | null>(null);

  const API_BASE_URL = process.env.VITE_BOR_SERVER_URL || 'http://localhost:6969';

  // Fetch current session status
  const fetchSessionStatus = async () => {
    if (!token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/current`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSession(data.session);
      }
    } catch (error) {
      console.error('Error fetching session status:', error);
    }
  };

  // Fetch agent availability for queue details
  const fetchAgentAvailability = async () => {
    if (!agentId) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/agents/availability`);
      if (response.ok) {
        const data = await response.json();
        setAgentAvailability(data.agents[agentId] || null);
      }
    } catch (error) {
      console.error('Error fetching agent availability:', error);
    }
  };

  // Cancel queued session
  const cancelSession = async () => {
    if (!session || session.status !== 'queued' || !token) return;

    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId: session.id }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Session cancelled. ${data.refundedPoints} points refunded.`);
        navigate('/');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session');
    }
  };

  // Update countdown timer
  useEffect(() => {
    if (!session) return;

    if (session.status === 'active' && session.remainingTimeSeconds) {
      const updateTimer = () => {
        const now = Date.now();
        const endTime = new Date(session.endTime!).getTime();
        const remaining = Math.max(0, Math.floor((endTime - now) / 1000));

        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60);
          const seconds = remaining % 60;
          setTimeLeft(`${minutes}:${seconds.toString().padStart(2, '0')}`);
        } else {
          setTimeLeft('Session ended');
          // Show session ended message and redirect
          setTimeout(() => {
            alert('Your private session has ended. Thank you!');
            navigate('/');
          }, 2000);
        }
      };

      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    }
  }, [session, navigate]);

  // Listen for session updates via socket
  useEffect(() => {
    if (!window.socket) return;

    const handleSessionUpdate = (data: any) => {
      console.log('Session update received:', data);
      
      if (data.type === 'session_started') {
        setSession(prev => prev ? {
          ...prev,
          status: 'active',
          remainingTimeSeconds: 5 * 60, // 5 minutes
          endTime: data.endTime
        } : null);
      } else if (data.type === 'session_ended') {
        alert('Your private session has ended. Thank you!');
        navigate('/');
      } else if (data.type === 'session_warning') {
        alert(data.message); // Show 1-minute warning
      } else if (data.type === 'queue_warning') {
        alert(data.message); // Show "you're next" message
      }
    };

    window.socket.on('session_update', handleSessionUpdate);

    return () => {
      window.socket?.off('session_update', handleSessionUpdate);
    };
  }, [navigate]);

  // Initial load
  useEffect(() => {
    if (!user) {
      navigate('/');
      return;
    }

    fetchSessionStatus();
    fetchAgentAvailability();
    setLoading(false);

    // Poll for updates every 10 seconds
    const interval = setInterval(() => {
      fetchSessionStatus();
      fetchAgentAvailability();
    }, 10000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="bg-slate-800 p-8 rounded-lg border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4">❌</div>
          <h2 className="text-2xl font-bold mb-4">No Active Session</h2>
          <p className="text-gray-600 mb-6">
            You don't have any active or queued sessions.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (session.status === 'queued') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center" style={{ backgroundColor: '#0f172a' }}>
        <div className="bg-slate-800 p-8 rounded-lg border border-white/20 text-center max-w-md">
          <div className="text-6xl mb-4">⏰</div>
          <h2 className="text-2xl font-bold mb-4">You're in Queue</h2>
          
          <div className="mb-6">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              #{session.queuePosition || 'N/A'}
            </div>
            <p className="text-gray-600">
              You're number {session.queuePosition || 'N/A'} in line
            </p>
          </div>

          {/* Current Session Info */}
          {agentAvailability && agentAvailability.currentSession && (
            <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">🎮 Current Session</h4>
              <div className="text-sm text-blue-800">
                <p><strong>User:</strong> {agentAvailability.currentSession.name}</p>
                <p><strong>Time Remaining:</strong> {Math.floor(agentAvailability.currentSession.remainingSeconds / 60)}:{(agentAvailability.currentSession.remainingSeconds % 60).toString().padStart(2, '0')}</p>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 p-4 rounded-md mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Estimated wait time:</strong> {session.estimatedWaitMinutes || 'calculating...'} minutes
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Each private session lasts 5 minutes
            </p>
          </div>

          {/* Queue Details */}
          {agentAvailability && agentAvailability.queueDetails && agentAvailability.queueDetails.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 p-4 rounded-md mb-6">
              <h4 className="font-semibold text-gray-900 mb-3">📋 Queue Details</h4>
              <div className="space-y-2">
                {agentAvailability.queueDetails.map((queueItem, index) => {
                  const isCurrentUser = queueItem.userId === user?.id;
                  return (
                    <div 
                      key={index} 
                      className={`flex items-center justify-between p-2 rounded text-sm ${
                        isCurrentUser 
                          ? 'bg-blue-100 border border-blue-300 font-semibold' 
                          : 'bg-white border border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-400 text-white'
                        }`}>
                          #{queueItem.position}
                        </span>
                        <span className={isCurrentUser ? 'text-blue-900' : 'text-gray-700'}>
                          {isCurrentUser ? 'You' : queueItem.userName}
                          {isCurrentUser && ' (You)'}
                        </span>
                      </div>
                      <div className={`text-xs ${isCurrentUser ? 'text-blue-700' : 'text-gray-500'}`}>
                        Est. start: {new Date(queueItem.estimatedStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={cancelSession}
              className="w-full px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50"
            >
              Cancel & Refund Points
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Wait in Background
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active session
  return (
    <div className="min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      {/* Fixed background layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-blue-900 to-purple-900 -z-10"></div>
      {/* Session Header */}
      <div className="bg-black bg-opacity-50 text-white p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <h1 className="text-xl font-bold">Private Session Active</h1>
          </div>
          
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-2xl font-mono font-bold">
                {timeLeft}
              </div>
              <div className="text-xs opacity-75">Time Remaining</div>
            </div>
            
            <div className="text-center">
              <div className="text-lg font-semibold">Agent {session.agentId}</div>
              <div className="text-xs opacity-75">Private Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/10 rounded-lg p-6 text-white text-center">
            <div className="text-6xl mb-4">🤖</div>
            <h2 className="text-3xl font-bold mb-4">
              Welcome to Your Private Session!
            </h2>
            <p className="text-xl opacity-90 mb-6">
              You have exclusive access to Agent {session.agentId} for the next {timeLeft}.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="text-2xl mb-2">💰</div>
                <div className="font-semibold">Cost</div>
                <div className="text-sm opacity-75">10 Points</div>
              </div>
              
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="text-2xl mb-2">⏱️</div>
                <div className="font-semibold">Duration</div>
                <div className="text-sm opacity-75">5 Minutes</div>
              </div>
              
              <div className="bg-white bg-opacity-10 p-4 rounded-lg">
                <div className="text-2xl mb-2">🔒</div>
                <div className="font-semibold">Privacy</div>
                <div className="text-sm opacity-75">Exclusive Access</div>
              </div>
            </div>

            <div className="bg-yellow-500 bg-opacity-20 border border-yellow-400 p-4 rounded-lg">
              <p className="text-sm">
                <strong>Note:</strong> This is a simulated private session. In a real implementation, 
                you would have exclusive access to the AI agent with enhanced features, 
                priority responses, and advanced capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="fixed bottom-4 right-4">
        <button
          onClick={() => {
            if (confirm('Are you sure you want to end your session early?')) {
              navigate('/');
            }
          }}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 shadow-lg"
        >
          End Session Early
        </button>
      </div>
    </div>
  );
};