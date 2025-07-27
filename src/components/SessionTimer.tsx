import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSessionBooking } from '../hooks/useSessionBooking';

export const SessionTimer: React.FC = () => {
  const navigate = useNavigate();
  const { currentSession: authSession } = useAuth();
  const { currentSession, refreshSession } = useSessionBooking();
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
  const isFreeModel = !session || !session.endTime || session.type === 'public';
  
  if (!session || session.status !== 'active') {
    return (
      <div className="fixed top-4 right-4 z-[100]">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
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
          Home
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors shadow-lg"
        >
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
          Home
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex items-center gap-4 bg-black/80 backdrop-blur-md rounded-lg px-6 py-3 border border-gray-700">
      {/* Session Timer */}
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center">
          <span className="text-xs text-gray-400">Session Time</span>
          <span className={`text-2xl font-bold font-mono ${
            isLowTime ? 'text-red-500 animate-pulse' : 'text-white'
          }`}>
            {formatTime(remainingTime)}
          </span>
        </div>
        
        {session.endTime && (
          <div className="flex flex-col items-center border-l border-gray-600 pl-3">
            <span className="text-xs text-gray-400">Ends at</span>
            <span className="text-sm text-gray-300">
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
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
      >
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
        Home
      </button>

      {/* Low time warning */}
      {isLowTime && remainingTime > 0 && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 bg-red-600 text-white text-xs px-3 py-1 rounded-md animate-bounce">
          Session ending soon!
        </div>
      )}
    </div>
  );
};