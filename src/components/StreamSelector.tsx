import { Link } from 'react-router-dom';
import { NEW_STREAM_CONFIGS } from '../utils/constants';

export function StreamSelector() {
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-4xl font-bold text-center mb-12">Select a Live Stream</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {NEW_STREAM_CONFIGS.map((stream) => (
          <Link
            key={stream.id}
            to={`/${stream.identifier}`}
            className="group relative overflow-hidden rounded-lg transition-transform hover:scale-105"
            style={{ borderColor: stream.color }}
          >
            <div 
              className="p-6 border-2 rounded-lg h-full flex flex-col"
              style={{ borderColor: stream.color }}
            >
              <div className="flex items-center mb-4">
                <img 
                  src={stream.creator.avatar} 
                  alt={stream.creator.username}
                  className="w-12 h-12 rounded-full mr-3"
                  onError={(e) => { e.currentTarget.src = '/images/default-avatar.png' }}
                />
                <div>
                  <h3 className="text-xl font-semibold">{stream.title}</h3>
                  <p className="text-sm text-gray-400">{stream.twitter}</p>
                </div>
              </div>
              
              <p className="text-gray-300 mb-4 flex-grow">{stream.description}</p>
              
              <div className="flex items-center justify-between">
                <span 
                  className="inline-block px-3 py-1 rounded-full text-xs font-medium"
                  style={{ backgroundColor: stream.color + '20', color: stream.color }}
                >
                  {stream.modelName}
                </span>
                
                <div className="flex items-center text-sm text-gray-500">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  {stream.stats.comments}
                </div>
              </div>
              
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ 
                  background: `radial-gradient(circle at center, ${stream.color}10 0%, transparent 70%)`
                }}
              />
            </div>
          </Link>
        ))}
      </div>

      <div className="text-center mt-12">
        <Link 
          to="/app"
          className="text-gray-400 hover:text-white transition-colors"
        >
          View All Streams (Scroll Mode) →
        </Link>
      </div>
    </div>
  );
}