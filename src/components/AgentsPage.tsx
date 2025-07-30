import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSessionBooking } from '../hooks/useSessionBooking';
import { BookingAuthModal } from './BookingAuthModal';

export const AgentsPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { models, currentSession, handleModelBook: originalHandleModelBook } = useSessionBooking();
  
  // Filter and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAccessType, setSelectedAccessType] = useState('all');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBookingAuthModal, setShowBookingAuthModal] = useState(false);
  const [selectedModelForBooking, setSelectedModelForBooking] = useState<any>(null);
  
  const itemsPerPage = 9;

  // Mock categories - in the future these could come from the API
  const categories = [
    { id: 'all', name: 'All Categories', icon: '🌟' },
    { id: 'general', name: 'General AI', icon: '🤖' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'creative', name: 'Creative', icon: '🎨' },
    { id: 'technical', name: 'Technical', icon: '⚡' },
    { id: 'entertainment', name: 'Entertainment', icon: '🎭' },
  ];

  // Enhanced models with mock categories for demonstration
  const enhancedModels = useMemo(() => {
    return models.map(model => ({
      ...model,
      category: model.modelName === 'trump' ? 'entertainment' :
                model.modelName === 'borp' ? 'general' :
                model.modelName === 'alpha' ? 'technical' : 'general',
      rating: Math.random() * 2 + 3, // Mock rating 3-5
      totalSessions: Math.floor(Math.random() * 10000) + 1000, // Mock session count
      description: model.description || 
        (model.modelName === 'trump' ? 'Experience conversations with dynamic political perspectives and engaging discussions.' :
         model.modelName === 'borp' ? 'Your friendly AI companion with deep knowledge and engaging personality for meaningful conversations.' :
         model.modelName === 'alpha' ? 'Advanced AI agent specialized in technical topics, problem-solving, and analytical discussions.' :
         `Experience ${model.displayName} in immersive AI conversations.`)
    }));
  }, [models]);

  // Filter and sort logic
  const filteredAndSortedModels = useMemo(() => {
    let filtered = enhancedModels;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(model => 
        model.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(model => model.category === selectedCategory);
    }

    // Access type filter
    if (selectedAccessType !== 'all') {
      filtered = filtered.filter(model => model.accessType === selectedAccessType);
    }

    // Price filter
    filtered = filtered.filter(model => 
      model.pointsCost >= priceRange.min && model.pointsCost <= priceRange.max
    );

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.displayName.localeCompare(b.displayName);
        case 'price':
          return a.pointsCost - b.pointsCost;
        case 'rating':
          return b.rating - a.rating;
        case 'popularity':
          return b.totalSessions - a.totalSessions;
        default:
          return 0;
      }
    });

    return filtered;
  }, [enhancedModels, searchTerm, selectedCategory, selectedAccessType, priceRange, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedModels.length / itemsPerPage);
  const paginatedModels = filteredAndSortedModels.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Handle model booking
  const handleModelBook = async (modelName: string) => {
    const model = enhancedModels.find(m => m.modelName === modelName);
    if (!model) return;

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

    // If authenticated, use the original booking flow
    await originalHandleModelBook(modelName);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedAccessType('all');
    setPriceRange({ min: 0, max: 1000 });
    setSortBy('name');
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      {/* Fixed background layer */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 -z-10"></div>
      {/* Header */}
      <header className="relative z-50 bg-slate-900/90 border-b border-white/10" style={{ backgroundColor: 'rgba(15, 23, 42, 0.9)' }}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">BOR Platform</h1>
                <p className="text-xs text-gray-300">AI Agents Directory</p>
              </div>
            </Link>
            
            <Link 
              to="/"
              className="px-4 py-2 text-gray-300 hover:text-white border border-gray-600 rounded-lg hover:bg-white/10 transition-all duration-200"
            >
              ← Back to Home
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            AI Agents Directory
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover and interact with our growing collection of specialized AI agents. 
            Each agent brings unique capabilities and personality to enhance your conversations.
          </p>
        </div>

        {/* Filters and Search */}
        <div className="mb-8 space-y-6">
          {/* Search Bar */}
          <div className="relative max-w-md mx-auto">
            <input
              type="text"
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-12 bg-black/30 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-white placeholder-gray-400"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </div>
          </div>

          {/* Filter Row */}
          <div className="flex flex-wrap gap-4 justify-center items-center">
            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>

            {/* Access Type Filter */}
            <select
              value={selectedAccessType}
              onChange={(e) => setSelectedAccessType(e.target.value)}
              className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">All Types</option>
              <option value="free">🌍 Free</option>
              <option value="premium">💎 Premium</option>
            </select>

            {/* Sort By */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 bg-black/30 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="name">Sort by Name</option>
              <option value="price">Sort by Price</option>
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
            Found {filteredAndSortedModels.length} agents
            {filteredAndSortedModels.length !== enhancedModels.length && ` of ${enhancedModels.length} total`}
          </div>
        </div>

        {/* Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {paginatedModels.map((model) => {
            const isCurrentlyActive = currentSession && model.modelName === currentSession.modelName;
            const isFree = model.accessType === 'free';
            
            return (
              <div 
                key={model.modelName} 
                className="group relative bg-white/5 rounded-3xl border border-white/20 overflow-hidden transition-all duration-300 hover:border-white/40"
              >
                {/* Category Badge */}
                <div className="absolute top-4 left-4 z-10">
                  <div className="bg-black/70 text-white px-2 py-1 rounded-full text-xs">
                    {categories.find(c => c.id === model.category)?.icon} {categories.find(c => c.id === model.category)?.name}
                  </div>
                </div>

                {/* Access Type Badge */}
                <div className="absolute top-4 right-4 z-10">
                  <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                    isFree 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gradient-to-r from-yellow-400 to-orange-500 text-black'
                  }`}>
                    {isFree ? '🌍 FREE' : '💎 PREMIUM'}
                  </div>
                </div>

                {/* Agent Avatar */}
                <div className="relative p-8 text-center">
                  {model.displayName === 'Trump AI' ? (
                    <div className="relative w-48 h-48 mx-auto mb-6 group">
                      <img 
                        src="/avatar/trump-avatar.png" 
                        alt="Trump AI Avatar"
                        className="w-48 h-48 rounded-3xl object-cover shadow-lg transition-all duration-200 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center text-8xl transition-all duration-300 group-hover:scale-105" style={{ display: 'none' }}>
                        🇺🇸
                      </div>
                    </div>
                  ) : model.displayName === 'Borp AI' ? (
                    <div className="relative w-48 h-48 mx-auto mb-6 group">
                      <img 
                        src="/avatar/bor-avatar.png" 
                        alt="Borp AI Avatar"
                        className="w-48 h-48 rounded-3xl object-cover shadow-lg transition-all duration-200 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="w-48 h-48 bg-gradient-to-br from-purple-500 to-blue-600 rounded-3xl flex items-center justify-center text-8xl transition-all duration-300 group-hover:scale-105" style={{ display: 'none' }}>
                        🤖
                      </div>
                    </div>
                  ) : model.displayName === 'Agent Alpha' ? (
                    <div className="relative w-48 h-48 mx-auto mb-6 group">
                      <img 
                        src="/avatar/naruto-avatar.png" 
                        alt="Agent Alpha - Naruto"
                        className="w-48 h-48 rounded-3xl object-cover shadow-lg transition-all duration-200 group-hover:scale-105"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const fallback = target.nextElementSibling as HTMLElement;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                      <div className="w-48 h-48 bg-gradient-to-br from-orange-500 to-blue-600 rounded-3xl flex items-center justify-center text-8xl transition-all duration-300 group-hover:scale-105" style={{ display: 'none' }}>
                        ⚡
                      </div>
                    </div>
                  ) : (
                    <div className="w-48 h-48 mx-auto mb-6 bg-purple-600 rounded-3xl flex items-center justify-center text-8xl group shadow-lg transition-all duration-200 hover:scale-105">
                      {model.displayName.charAt(0)}
                    </div>
                  )}
                  
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

                  <p className="text-gray-300 text-sm mb-4 leading-relaxed">
                    {model.description}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-white font-medium">Price</div>
                      <div className="text-gray-300">
                        {isFree ? 'Free' : `${model.pointsCost} pts`}
                      </div>
                    </div>
                    <div className="bg-black/20 rounded-lg p-3">
                      <div className="text-white font-medium">Sessions</div>
                      <div className="text-gray-300">{model.totalSessions.toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200"
                    onClick={() => handleModelBook(model.modelName)}
                  >
                    {isFree ? '🌍 Start Free Session' : '💎 Book Session'}
                  </button>
                </div>
              </div>
            );
          })}
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
                    ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
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
            <div className="text-6xl mb-4">🤖</div>
            <h3 className="text-2xl font-bold text-white mb-2">No agents found</h3>
            <p className="text-gray-300 mb-6">Try adjusting your filters or search terms</p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-200"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </div>

      {/* Booking Auth Modal */}
      <BookingAuthModal 
        isOpen={showBookingAuthModal}
        onClose={() => {
          setShowBookingAuthModal(false);
          setSelectedModelForBooking(null);
        }}
        onSuccess={() => {
          setShowBookingAuthModal(false);
          if (selectedModelForBooking) {
            handleModelBook(selectedModelForBooking.modelName);
          }
          setSelectedModelForBooking(null);
        }}
        modelConfig={selectedModelForBooking}
      />
    </div>
  );
};