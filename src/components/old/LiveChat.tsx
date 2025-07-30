import React, { useEffect, useRef } from 'react';
import { Diamond } from 'lucide-react';
import { useScene } from '../../contexts/ScenesContext';
import { useAuth } from '../../contexts/AuthContext';
import { FREE_MODEL_AGENT_ID } from '../../utils/constants';



const truncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

export function LiveChat() {
  const { comments, currentAgentId } = useScene();
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Filter comments for private sessions
  const filteredComments = React.useMemo(() => {
    console.log('LiveChat filtering:', {
      commentsCount: comments.length,
      currentAgentId,
      isFreeModel: currentAgentId === FREE_MODEL_AGENT_ID,
      userEmail: user?.email,
      firstCommentSender: comments[0]?.sender,
      firstCommentUser: comments[0]?.user,
      firstComment: comments[0]
    });
    
    // For free model, show all comments
    if (currentAgentId === FREE_MODEL_AGENT_ID) {
      return comments;
    }
    
    // For private models, only show authenticated user's comments
    if (user && user.email) {
      const filtered = comments.filter(comment => 
        comment.sender === user.email || 
        comment.user === user.email || // Support both field names
        comment.messageType === 'system' // Always show system messages
      );
      console.log('Filtered comments:', filtered.length, 'out of', comments.length);
      return filtered;
    }
    
    // If not authenticated, don't show any comments for private models
    return [];
  }, [comments, currentAgentId, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredComments]);
 
  const isPrivateSession = currentAgentId !== FREE_MODEL_AGENT_ID;
  
  return (
    <div className="absolute bottom-0 left-4 z-[0] w-80 p-4">
      
      <div 
        ref={scrollContainerRef}
        className="space-y-2 overflow-y-auto max-h-96 chat-scrollbar pr-2"
      >
        {filteredComments.map((comment, index) => (
            <div
              key={comment.id}
              className="group animate-slideUpAndScale transition-all duration-300 ease-out"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
                <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-xl p-1">
                  <div className="bg-slate-900/95 rounded-xl p-3">
                    <div className="flex items-start space-x-2">
                      <div className="relative flex-shrink-0">
                        <img 
                          src={comment.avatar} 
                          alt="User Avatar" 
                          className="w-8 h-8 rounded-full ring-1 ring-white/20 
                            group-hover:ring-white/40 transition-all duration-300" 
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 
                          bg-gradient-to-r from-green-400 to-blue-400 rounded-full 
                          border border-slate-900"></div>
                      </div>
                      
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-xs bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent truncate">
                            {comment.handle}
                          </span>
                          <div className="text-xs text-slate-500 flex-shrink-0 ml-2">
                            {new Date(comment.createdAt).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        
                        <div className="overflow-hidden">
                          {comment.message.includes('diamonds') ? (
                            <div className="inline-flex items-center space-x-1 rounded-lg border border-yellow-500/30 shadow-md backdrop-blur-sm">
                              <div className="bg-gradient-to-r from-yellow-500/20 via-orange-500/20 to-yellow-500/20 rounded-lg p-1">
                                <div className="bg-slate-900/95 rounded-lg px-2 py-1 flex items-center gap-1">
                                  <Diamond className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                  <span className="text-yellow-100 text-xs font-medium truncate">
                                    {truncateText(comment.message, 45)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs leading-relaxed text-slate-200 font-medium break-words">
                              {truncateText(comment.message, 60)}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        
        {filteredComments.length === 0 && (
          <div className="text-center py-6 animate-fadeIn">
            <div className="rounded-xl border border-white/10 shadow-lg backdrop-blur-md">
              <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-xl p-1">
                <div className="bg-slate-900/95 rounded-xl p-4">
                  <div className="text-slate-400 text-xs">
                    <div className="mb-2">💬</div>
                    <p className="font-medium">No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Invisible element to scroll to */}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}