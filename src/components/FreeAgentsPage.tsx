import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSessionBooking } from '../hooks/useSessionBooking';

export const FreeAgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { models } = useSessionBooking();
  
  // Filter states for free agents
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  
  const itemsPerPage = 6;

  // Only get free models
  const freeModels = useMemo(() => {
    return models.filter(model => model.accessType === 'free').map(model => ({
      ...model,
      rating: Math.random() * 2 + 3, // Mock rating 3-5
      totalSessions: Math.floor(Math.random() * 10000) + 1000, // Mock session count
      description: model.description || 
        (model.modelName === 'trump' ? 'Experience conversations with dynamic political perspectives. Engage in discussions about policy, current events, and leadership with unlimited free access.' :
         `Experience ${model.displayName} in unlimited free conversations. Chat about any topic without restrictions or time limits.`)
    }));
  }, [models]);

  // Filter and sort logic
  const filteredAndSortedModels = useMemo(() => {
    let filtered = freeModels;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(model => 
        model.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'rating':
          return b.rating - a.rating;
        case 'popularity':
          return b.totalSessions - a.totalSessions;
        default:
          return 0;
      }
    });

    return filtered;
  }, [freeModels, searchTerm, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedModels.length / itemsPerPage);
  const paginatedModels = filteredAndSortedModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle starting free session
  const handleStartSession = (modelName: string) => {
    navigate(`/${modelName}`);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSortBy('name');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 bg-black/20 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🌍</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Free Live Agents</h1>
                <p className="text-xs text-gray-300">Unlimited conversations • No registration required</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-4">
              <Link 
                to="/agents"
                className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                💎 Premium Agents
              </Link>
              <Link 
                to="/"
                className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-white/10 transition-all duration-200"
              >
                ← Back to Home
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
            Free Live AI Agents
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Start conversations instantly with our free AI agents. No registration, no time limits, no restrictions. 
            Just pure AI interaction available 24/7.
          </p>
          
          {/* Benefits Banner */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            <div className="bg-green-500/20 backdrop-blur-sm rounded-lg p-4 border border-green-500/30">
              <div className="text-2xl mb-2">🌍</div>
              <h3 className="text-white font-medium">Completely Free</h3>
              <p className="text-green-200 text-sm">No hidden costs or limits</p>
            </div>
            <div className="bg-blue-500/20 backdrop-blur-sm rounded-lg p-4 border border-blue-500/30">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="text-white font-medium">Instant Access</h3>
              <p className="text-blue-200 text-sm">Start chatting immediately</p>
            </div>
            <div className="bg-purple-500/20 backdrop-blur-sm rounded-lg p-4 border border-purple-500/30">
              <div className="text-2xl mb-2">🔄</div>
              <h3 className="text-white font-medium">Unlimited Sessions</h3>
              <p className="text-purple-200 text-sm">Chat as long as you want</p>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search free agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-white placeholder-gray-400"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="popularity">Sort by Popularity</option>
            </select>

            {/* Clear Filters */}
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              Clear Filters
            </button>
          </div>

          {/* Results Count */}
          <div className="text-center text-gray-300">
            {filteredAndSortedModels.length} free agent{filteredAndSortedModels.length !== 1 ? 's' : ''} available
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {paginatedModels.map((model) => (
            <div 
              key={model.modelName} 
              className="group relative bg-gradient-to-b from-green-500/10 to-green-600/5 backdrop-blur-sm rounded-3xl border border-green-500/20 overflow-hidden transition-all duration-500 hover:transform hover:scale-105 hover:border-green-400/40"
            >
              {/* Free Badge */}
              <div className="absolute top-4 right-4 z-10">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold animate-pulse">
                  🌍 FREE
                </div>
              </div>

              {/* Agent Avatar */}
              <div className="relative p-8 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center text-2xl">
                  {model.displayName === 'Trump AI' ? '🇺🇸' : 
                   model.displayName.charAt(0)}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {model.displayName}
                </h3>
                
                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-3">
                  <div className="flex text-yellow-400">
                    {'★'.repeat(Math.floor(model.rating))}
                    {'☆'.repeat(5 - Math.floor(model.rating))}
                  </div>
                  <span className="text-sm text-gray-400">({model.rating.toFixed(1)})</span>
                </div>

                <p className="text-gray-300 text-sm mb-6 leading-relaxed">
                  {model.description}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-white font-medium">Sessions</div>
                    <div className="text-green-400">{model.totalSessions.toLocaleString()}</div>
                  </div>
                  <div className="bg-black/20 rounded-lg p-3">
                    <div className="text-white font-medium">Status</div>
                    <div className="text-green-400 flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      Live
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  className="w-full py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  onClick={() => handleStartSession(model.modelName)}
                >
                  🌍 Start Free Session
                </button>
                
                <p className="text-xs text-gray-400 mt-2">
                  No registration required • Unlimited time
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              ← Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  page === currentPage
                    ? 'bg-gradient-to-r from-green-500 to-green-600 text-white'
                    : 'bg-black/30 border border-white/20 text-white hover:bg-white/10'
                }`}
              >
                {page}
              </button>
            ))}
            
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              Next →
            </button>
          </div>
        )}

        {/* No Results */}
        {filteredAndSortedModels.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🌍</div>
            <h3 className="text-2xl font-bold text-white mb-2">No free agents found</h3>
            <p className="text-gray-300 mb-6">Try adjusting your search terms</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-green-700 transition-all duration-200"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-16 text-center bg-gradient-to-r from-green-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl p-8 border border-white/10">
          <h3 className="text-2xl font-bold text-white mb-4">Want More Powerful AI?</h3>
          <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
            Upgrade to premium AI agents for private sessions, advanced capabilities, and personalized conversations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/agents"
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              💎 View Premium Agents
            </Link>
            {!isAuthenticated && (
              <Link 
                to="/"
                className="px-6 py-3 border border-white/30 text-white rounded-lg font-medium hover:bg-white/10 transition-all duration-200"
              >
                🚀 Create Free Account
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};