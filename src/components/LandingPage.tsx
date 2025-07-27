import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { AuthModal } from './auth/AuthModal';
import { UserProfile } from './auth/UserProfile';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Users, 
  Lock, 
  Coins, 
  Clock, 
  Star, 
  Play, 
  Calendar,
  Globe,
  Shield,
  Zap,
  ArrowRight,
  Heart
} from 'lucide-react';

interface AgentCardProps {
  agent: {
    id: string;
    name: string;
    description: string;
    category: string;
    avatar: string;
    isOnline: boolean;
    viewers: number;
    rating: number;
    pointsPerSession: number;
    isPublic: boolean;
    isPrivate: boolean;
  };
  onSelectAgent: (agentId: string, type: 'public' | 'private') => void;
}

const AgentCard: React.FC<AgentCardProps> = ({ agent, onSelectAgent }) => {
  const { isAuthenticated } = useAuth();

  return (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <img 
              src={agent.avatar} 
              alt={agent.name}
              className="w-12 h-12 rounded-full object-cover"
            />
            {agent.isOnline && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg truncate">{agent.name}</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                {agent.category}
              </Badge>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 fill-yellow-400 text-yellow-400" />
                {agent.rating.toFixed(1)}
              </div>
            </div>
          </div>
        </div>
        <CardDescription className="text-sm line-clamp-2">
          {agent.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{agent.viewers} watching</span>
          </div>
          <div className="flex items-center space-x-1">
            <Coins className="h-4 w-4 text-yellow-500" />
            <span>{agent.pointsPerSession} points</span>
          </div>
        </div>

        <div className="flex space-x-2">
          {agent.isPublic && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onSelectAgent(agent.id, 'public')}
            >
              <Globe className="h-4 w-4 mr-1" />
              Free Chat
            </Button>
          )}
          
          {agent.isPrivate && (
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onSelectAgent(agent.id, 'private')}
              disabled={!isAuthenticated}
            >
              <Lock className="h-4 w-4 mr-1" />
              Private
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const LandingPage: React.FC = () => {
  const { isAuthenticated, user } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Mock agent data - replace with actual API call
  const [agents] = useState([
    {
      id: '1',
      name: 'Aria',
      description: 'A friendly AI companion who loves to chat about anything and everything. Perfect for casual conversations.',
      category: 'General',
      avatar: '/api/placeholder/100/100',
      isOnline: true,
      viewers: 42,
      rating: 4.8,
      pointsPerSession: 10,
      isPublic: true,
      isPrivate: true,
    },
    {
      id: '2',
      name: 'Professor Nova',
      description: 'An AI tutor specialized in science and technology. Great for learning and academic discussions.',
      category: 'Education',
      avatar: '/api/placeholder/100/100',
      isOnline: true,
      viewers: 18,
      rating: 4.9,
      pointsPerSession: 15,
      isPublic: true,
      isPrivate: true,
    },
    {
      id: '3',
      name: 'Creative Cosmos',
      description: 'An artistic AI that helps with creative projects, writing, and inspiration.',
      category: 'Creative',
      avatar: '/api/placeholder/100/100',
      isOnline: false,
      viewers: 0,
      rating: 4.7,
      pointsPerSession: 12,
      isPublic: true,
      isPrivate: true,
    },
  ]);

  const handleSelectAgent = (agentId: string, type: 'public' | 'private') => {
    if (type === 'private' && !isAuthenticated) {
      setAuthMode('login');
      setShowAuthModal(true);
      return;
    }

    // Navigate to agent room - replace with your routing logic
    console.log(`Navigating to ${type} room for agent ${agentId}`);
    // Example: navigate(`/${type}/${agentId}`);
  };

  const handleGetStarted = () => {
    setAuthMode('signup');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">BOR Platform</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <UserProfile variant="compact" />
              ) : (
                <div className="flex space-x-2">
                  <Button 
                    variant="ghost" 
                    onClick={() => {
                      setAuthMode('login');
                      setShowAuthModal(true);
                    }}
                  >
                    Sign In
                  </Button>
                  <Button onClick={handleGetStarted}>
                    Get Started
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            Chat with AI Agents in 
            <span className="text-primary"> 3D Virtual Worlds</span>
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Experience the future of AI interaction with lifelike 3D avatars. 
            Join public conversations for free or book private sessions with points.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" onClick={handleGetStarted}>
              Start Free Chat
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg">
              Watch Demo
              <Play className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <Card>
              <CardHeader>
                <Globe className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Free Public Rooms</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Join ongoing conversations with AI agents. No signup required for public chats.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Lock className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Private Sessions</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Book 5-minute private sessions with points. Personalized AI interactions just for you.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Heart className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle>Points System</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get 100 free points on signup. Points regenerate every 24 hours automatically.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Agents Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold mb-4">Meet Our AI Agents</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Each agent has their own personality, expertise, and 3D avatar. 
              Start with free public chats or book private sessions.
            </p>
          </div>

          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-4 max-w-md mx-auto mb-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="online">Online</TabsTrigger>
              <TabsTrigger value="free">Free</TabsTrigger>
              <TabsTrigger value="featured">Featured</TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    onSelectAgent={handleSelectAgent}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="online">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.filter(agent => agent.isOnline).map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    onSelectAgent={handleSelectAgent}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="free">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.filter(agent => agent.isPublic).map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    onSelectAgent={handleSelectAgent}
                  />
                ))}
              </div>
            </TabsContent>

            <TabsContent value="featured">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {agents.filter(agent => agent.rating >= 4.8).map((agent) => (
                  <AgentCard 
                    key={agent.id} 
                    agent={agent} 
                    onSelectAgent={handleSelectAgent}
                  />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; 2024 BOR Platform. Experience the future of AI interaction.</p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultMode={authMode}
      />
    </div>
  );
};