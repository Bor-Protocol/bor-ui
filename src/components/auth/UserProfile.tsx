import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Separator } from '../ui/separator';
import { 
  User, 
  LogOut, 
  Coins, 
  Clock, 
  Crown, 
  Settings,
  ChevronDown 
} from 'lucide-react';

interface UserProfileProps {
  variant?: 'full' | 'compact' | 'dropdown';
  showPoints?: boolean;
  showLogout?: boolean;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  variant = 'compact',
  showPoints = true,
  showLogout = true 
}) => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!isAuthenticated || !user) {
    return null;
  }

  const formatTimeUntilRegen = (regenTime: string) => {
    const now = new Date();
    const regen = new Date(regenTime);
    const diff = regen.getTime() - now.getTime();
    
    if (diff <= 0) return 'Available now';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSubscriptionColor = (tier: string) => {
    switch (tier) {
      case 'premium': return 'bg-yellow-500';
      case 'enterprise': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  // Compact variant (for header/navbar)
  if (variant === 'compact') {
    return (
      <div className="flex items-center space-x-3">
        {showPoints && (
          <div className="flex items-center space-x-1 bg-muted px-2 py-1 rounded-full">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span className="text-sm font-medium">{user.points}</span>
          </div>
        )}
        
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
              </Avatar>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <UserProfile variant="dropdown" />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  // Dropdown variant (for popover content)
  if (variant === 'dropdown') {
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback>{getUserInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-medium">{user.name}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className={getSubscriptionColor(user.subscription_tier)}>
              {user.subscription_tier === 'enterprise' && <Crown className="h-3 w-3 mr-1" />}
              {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
            </Badge>
            <Badge variant="outline">
              {user.user_type}
            </Badge>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Coins className="h-4 w-4 text-yellow-500" />
              <span className="text-sm">Points</span>
            </div>
            <span className="font-medium">{user.points}</span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Next regen</span>
            </div>
            <span>{formatTimeUntilRegen(user.points_next_regen)}</span>
          </div>
        </div>

        <Separator />

        <div className="flex flex-col space-y-2">
          <Button variant="ghost" size="sm" className="justify-start">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          
          {showLogout && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={logout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Full variant (for dedicated profile page)
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-20 w-20">
            <AvatarImage src={user.avatar} alt={user.name} />
            <AvatarFallback className="text-xl">{getUserInitials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{user.name}</CardTitle>
            <CardDescription className="text-base">{user.email}</CardDescription>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className={getSubscriptionColor(user.subscription_tier)}>
                {user.subscription_tier === 'enterprise' && <Crown className="h-3 w-3 mr-1" />}
                {user.subscription_tier.charAt(0).toUpperCase() + user.subscription_tier.slice(1)}
              </Badge>
              <Badge variant="outline">
                {user.user_type}
              </Badge>
              {user.email_verified && (
                <Badge variant="default" className="bg-green-500">
                  Verified
                </Badge>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Points Section */}
        <div className="bg-muted p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <Coins className="h-5 w-5 text-yellow-500" />
              <span className="font-medium">Available Points</span>
            </div>
            <span className="text-2xl font-bold">{user.points}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            Next regeneration: {formatTimeUntilRegen(user.points_next_regen)}
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">{user.total_sessions}</div>
            <div className="text-sm text-muted-foreground">Total Sessions</div>
          </div>
          <div className="text-center p-3 bg-muted rounded-lg">
            <div className="text-2xl font-bold">
              {Math.floor((Date.now() - new Date(user.points_next_regen).getTime() + 24 * 60 * 60 * 1000) / (24 * 60 * 60 * 1000))}
            </div>
            <div className="text-sm text-muted-foreground">Days Active</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-2">
          <Button className="flex-1">
            <Settings className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
          {showLogout && (
            <Button variant="outline" onClick={logout}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};