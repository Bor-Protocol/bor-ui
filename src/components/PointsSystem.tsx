import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Progress } from './ui/progress';
import { 
  Coins, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle,
  Gift,
  Zap,
  RefreshCw
} from 'lucide-react';

interface PointsSystemProps {
  showBalance?: boolean;
  showRegen?: boolean;
  variant?: 'full' | 'compact' | 'minimal';
}

export const PointsSystem: React.FC<PointsSystemProps> = ({ 
  showBalance = true,
  showRegen = true,
  variant = 'full'
}) => {
  const { user, updateUser } = useAuth();
  const [timeUntilRegen, setTimeUntilRegen] = useState<string>('');
  const [regenProgress, setRegenProgress] = useState<number>(0);

  useEffect(() => {
    if (!user) return;

    const updateRegenTime = () => {
      const now = new Date();
      const regen = new Date(user.points_next_regen);
      const diff = regen.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeUntilRegen('Available now');
        setRegenProgress(100);
        return;
      }
      
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeUntilRegen(`${hours}h ${minutes}m ${seconds}s`);
      
      // Calculate progress (assuming 24 hour cycle)
      const totalMs = 24 * 60 * 60 * 1000;
      const elapsedMs = totalMs - diff;
      setRegenProgress((elapsedMs / totalMs) * 100);
    };

    updateRegenTime();
    const interval = setInterval(updateRegenTime, 1000);
    
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  // Minimal variant (just the balance)
  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full">
        <Coins className="h-4 w-4 text-yellow-500" />
        <span className="text-sm font-medium">{user.points}</span>
      </div>
    );
  }

  // Compact variant (balance + quick info)
  if (variant === 'compact') {
    return (
      <Card className="w-full max-w-sm">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Points</span>
            </div>
            <span className="text-2xl font-bold">{user.points}</span>
          </div>
          
          {showRegen && regenProgress < 100 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Next regeneration</span>
                <span>{timeUntilRegen}</span>
              </div>
              <Progress value={regenProgress} className="h-1" />
            </div>
          )}
          
          {regenProgress >= 100 && (
            <div className="flex items-center text-xs text-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Points ready to regenerate
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full variant (complete points management)
  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <span>Points Balance</span>
        </CardTitle>
        <CardDescription>
          Use points to book private sessions with AI agents
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Current Balance */}
        <div className="text-center">
          <div className="text-4xl font-bold mb-2">{user.points}</div>
          <div className="text-sm text-muted-foreground">Available Points</div>
        </div>

        {/* Regeneration Status */}
        {showRegen && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <RefreshCw className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Next Regeneration</span>
              </div>
              <Badge variant={regenProgress >= 100 ? "default" : "secondary"}>
                {regenProgress >= 100 ? "Ready" : timeUntilRegen}
              </Badge>
            </div>
            
            <Progress value={regenProgress} className="h-2" />
            
            <div className="text-xs text-muted-foreground text-center">
              {regenProgress >= 100 ? (
                <span className="text-green-600">
                  <CheckCircle className="h-3 w-3 inline mr-1" />
                  100 points are ready to be added to your balance
                </span>
              ) : (
                `${Math.round(regenProgress)}% complete - Points regenerate every 24 hours`
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col">
            <Gift className="h-4 w-4 mb-1" />
            <span className="text-xs">Daily Bonus</span>
          </Button>
          <Button variant="outline" size="sm" className="h-auto p-3 flex flex-col">
            <Zap className="h-4 w-4 mb-1" />
            <span className="text-xs">Upgrade</span>
          </Button>
        </div>

        {/* Point Usage Info */}
        <div className="bg-muted p-3 rounded-lg">
          <div className="text-sm font-medium mb-2">Point Costs:</div>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between">
              <span>5-minute private session</span>
              <span>10 points</span>
            </div>
            <div className="flex justify-between">
              <span>Premium agent session</span>
              <span>15 points</span>
            </div>
            <div className="flex justify-between">
              <span>Extended session (10 min)</span>
              <span>20 points</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Component for spending points with confirmation
interface SpendPointsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  amount: number;
  description: string;
  agentName?: string;
}

export const SpendPointsDialog: React.FC<SpendPointsDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  amount,
  description,
  agentName
}) => {
  const { user } = useAuth();
  const [isSpending, setIsSpending] = useState(false);
  const [error, setError] = useState('');

  const handleConfirm = async () => {
    setIsSpending(true);
    setError('');
    
    try {
      const success = await onConfirm();
      if (success) {
        onClose();
      } else {
        setError('Failed to process payment. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSpending(false);
    }
  };

  if (!user) return null;

  const hasEnoughPoints = user.points >= amount;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Coins className="h-5 w-5 text-yellow-500" />
            <span>Spend Points</span>
          </DialogTitle>
          <DialogDescription>
            {agentName ? `Book a private session with ${agentName}` : description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Session Cost:</span>
              <span className="font-medium">{amount} points</span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Your Balance:</span>
              <span className="font-medium">{user.points} points</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">After Payment:</span>
                <span className={`font-medium ${hasEnoughPoints ? 'text-green-600' : 'text-red-600'}`}>
                  {hasEnoughPoints ? (user.points - amount) : 'Insufficient'} points
                </span>
              </div>
            </div>
          </div>

          {!hasEnoughPoints && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>You don't have enough points for this session</span>
            </div>
          )}

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSpending}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!hasEnoughPoints || isSpending}
          >
            {isSpending ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `Spend ${amount} Points`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};