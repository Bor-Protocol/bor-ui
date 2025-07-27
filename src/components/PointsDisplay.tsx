import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface PointsDisplayProps {
  showDetails?: boolean;
  className?: string;
}

export const PointsDisplay: React.FC<PointsDisplayProps> = ({ 
  showDetails = false, 
  className = "" 
}) => {
  const { user, pointsInfo, refreshPointsInfo } = useAuth();
  const [timeLeft, setTimeLeft] = useState<string>('');

  // Update countdown timer
  useEffect(() => {
    if (!pointsInfo?.nextRegeneration) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const nextRegen = new Date(pointsInfo.nextRegeneration!).getTime();
      const difference = nextRegen - now;

      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft('Ready to regenerate!');
        // Refresh points info to check for new points
        refreshPointsInfo();
      }
    };

    updateTimer(); // Initial call
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [pointsInfo?.nextRegeneration, refreshPointsInfo]);

  if (!user) return null;

  const canRegenerate = pointsInfo?.canRegenerate || false;
  const isAtMax = user.points >= (pointsInfo?.maxPoints || 200);

  if (!showDetails) {
    // Simple display for header
    return (
      <div className={`flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full ${className}`}>
        <span className="text-yellow-600">💰</span>
        <span className="text-sm font-medium">{user.points}</span>
        {pointsInfo && (
          <span className="text-xs text-yellow-600">
            /{pointsInfo.maxPoints}
          </span>
        )}
      </div>
    );
  }

  // Detailed display with dark theme
  return (
    <div className={className}>
      <div className="text-center">
        <div className="flex flex-col items-center mb-4">
          <div className="text-3xl font-bold text-yellow-400 mb-2">
            {user.points}
          </div>
          {pointsInfo && (
            <div className="text-sm text-gray-400">
              of {pointsInfo.maxPoints} points
            </div>
          )}
        </div>

        {/* Progress bar */}
        {pointsInfo && (
          <div className="mb-4">
            <div className="w-full bg-black/30 rounded-full h-2 mb-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.min((user.points / pointsInfo.maxPoints) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-400">
              {Math.round((user.points / pointsInfo.maxPoints) * 100)}% capacity
            </div>
          </div>
        )}

        {/* Daily regeneration info */}
        <div className="bg-black/20 rounded-lg p-3 mb-3">
          <div className="text-xs text-gray-400 mb-1">Daily regeneration</div>
          <div className="text-sm text-white font-medium">
            +{pointsInfo?.dailyRegenAmount || 50} points
          </div>
        </div>

        {/* Status info */}
        {isAtMax ? (
          <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 mb-3">
            <div className="text-green-300 text-xs">
              ✅ At maximum capacity
            </div>
          </div>
        ) : canRegenerate ? (
          <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3 mb-3">
            <div className="text-blue-300 text-xs">
              🔄 Points ready to regenerate
            </div>
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1">Next regeneration</div>
            <div className="text-sm font-mono text-white">
              {timeLeft || 'Calculating...'}
            </div>
          </div>
        )}

        {/* Quick usage info */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-gray-400">Session cost</div>
            <div className="text-white font-medium">10 pts</div>
          </div>
          <div className="bg-black/20 rounded-lg p-2">
            <div className="text-gray-400">Duration</div>
            <div className="text-white font-medium">5 min</div>
          </div>
        </div>
      </div>
    </div>
  );
};