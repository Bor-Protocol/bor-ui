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

  // Detailed display
  return (
    <div className={`bg-white p-6 rounded-lg border border-gray-200 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Points Balance</h3>
        <div className="flex items-center space-x-2">
          <span className="text-2xl">💰</span>
          <span className="text-2xl font-bold text-yellow-600">
            {user.points}
          </span>
          {pointsInfo && (
            <span className="text-gray-500">/ {pointsInfo.maxPoints}</span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {pointsInfo && (
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress to maximum</span>
            <span>{Math.round((user.points / pointsInfo.maxPoints) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min((user.points / pointsInfo.maxPoints) * 100, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Regeneration info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Daily regeneration:</span>
          <span className="font-medium">
            +{pointsInfo?.dailyRegenAmount || 50} points
          </span>
        </div>

        {isAtMax ? (
          <div className="flex items-center space-x-2 text-green-600 bg-green-50 p-3 rounded-md">
            <span>✅</span>
            <span className="text-sm font-medium">
              You're at maximum points! Use some points to make room for regeneration.
            </span>
          </div>
        ) : canRegenerate ? (
          <div className="flex items-center space-x-2 text-blue-600 bg-blue-50 p-3 rounded-md">
            <span>🔄</span>
            <span className="text-sm font-medium">
              Points are ready to regenerate! They'll be added automatically.
            </span>
          </div>
        ) : (
          <div className="text-center bg-gray-50 p-3 rounded-md">
            <div className="text-sm text-gray-600 mb-1">Next regeneration in:</div>
            <div className="text-lg font-mono font-bold text-gray-900">
              {timeLeft || 'Calculating...'}
            </div>
          </div>
        )}

        {/* Usage info */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-sm text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Private session cost:</span>
              <span className="font-medium">10 points</span>
            </div>
            <div className="flex justify-between">
              <span>Session duration:</span>
              <span className="font-medium">5 minutes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};