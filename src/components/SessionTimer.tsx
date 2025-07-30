import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSessionBooking } from '../hooks/useSessionBooking';
import { useScene } from '../contexts/ScenesContext';
import { FREE_MODEL_AGENT_ID } from '../utils/constants';

export const SessionTimer: React.FC = () => {
  const navigate = useNavigate();
  const { currentSession: authSession } = useAuth();
  const { currentSession, refreshSession } = useSessionBooking();
  const { currentAgentId } = useScene();
  const [remainingTime, setRemainingTime] = useState<number>(0);

  // Use session from either auth context or session booking
  const session = currentSession || authSession;

  useEffect(() => {
    if (!session || session.status !== 'active' || !session.endTime) {
      return;
    }

    const updateTimer = () => {
      const now = new Date().getTime();
      const endTime = new Date(session.endTime).getTime();
      const remaining = Math.max(0, Math.floor((endTime - now) / 1000));
      
      setRemainingTime(remaining);

      if (remaining === 0) {
        // Session ended, refresh session data
        refreshSession();
      }
    };

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [session, refreshSession]);

  // For free models or no active session, only show home button
  const isFreeModel = currentAgentId === FREE_MODEL_AGENT_ID || !session || !session.endTime || session.type === 'public';
  
  if (!session || session.status !== 'active') {
    return (
      <div className="fixed top-4 right-4 z-[100]">
        <button
          onClick={() => navigate('/')}
          className="group relative overflow-hidden flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            🏠 Home
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
    );
  }

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isLowTime = remainingTime <= 60; // Last minute warning

  // For free models, only show home button
  if (isFreeModel) {
    return (
      <div className="fixed top-4 right-4 z-[100]">
        <button
          onClick={() => navigate('/')}
          className="group relative overflow-hidden flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
        >
          <span className="relative z-10 flex items-center gap-2">
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
              />
            </svg>
            🏠 Home
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-[100] rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md animate-slideUpAndScale">
      <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-2xl p-1">
        <div className="bg-slate-900/95 rounded-2xl px-6 py-4 flex items-center gap-4">
          {/* Session Timer */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-xs text-slate-400 font-medium">⏱️ Session Time</span>
              <span className={`text-2xl font-bold font-mono ${
                isLowTime ? 'text-red-400 animate-pulse' : 'bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent'
              }`}>
                {formatTime(remainingTime)}
              </span>
            </div>
            
            {session.endTime && (
              <div className="flex flex-col items-center border-l border-white/20 pl-4">
                <span className="text-xs text-slate-400 font-medium">📅 Ends at</span>
                <span className="text-sm text-white font-semibold">
                  {new Date(session.endTime).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            )}
          </div>

          {/* Home Button */}
          <button
            onClick={() => navigate('/')}
            className="group relative overflow-hidden flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg"
          >
            <span className="relative z-10 flex items-center gap-2">
              <svg 
                className="w-4 h-4" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                />
              </svg>
              🏠 Home
            </span>
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          {/* Low time warning */}
          {isLowTime && remainingTime > 0 && (
            <div className="absolute -bottom-12 right-0 rounded-xl border border-red-500/30 shadow-2xl backdrop-blur-md animate-bounce">
              <div className="bg-gradient-to-r from-red-500/20 via-orange-500/20 to-red-500/20 rounded-xl p-1">
                <div className="bg-slate-900/95 rounded-xl px-4 py-2">
                  <div className="text-red-400 text-xs font-semibold flex items-center gap-2">
                    ⚠️ Session ending soon!
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};