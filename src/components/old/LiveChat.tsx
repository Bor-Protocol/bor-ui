import React from 'react';
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
 
  const isPrivateSession = currentAgentId !== FREE_MODEL_AGENT_ID;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[0] p-4 bg-gradient-to-t from-black/70 to-transparent">
      {/* Private session indicator */}
      {isPrivateSession && user && (
        <div className="mb-2 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-600/80 text-white">
            🔒 Private Session - Only your messages are shown
          </span>
        </div>
      )}
      <div className="mb-4 space-y-0.5 overflow-hidden">
        {filteredComments
          .slice(Math.max(filteredComments.length - 7, 0))
          .map((comment) => (
            <div
              key={comment.id}
              className="group flex items-start space-x-3 p-1 rounded-lg 
                animate-slide-up transition-all duration-300 ease-out"
            >
              <div className="relative pt-1">
                <img 
                  src={comment.avatar} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full ring-2 ring-white-500/50 
                    group-hover:ring-white-500 transition-all" 
                />
                {/* <div className="absolute -bottom-1 -right-1 w-3 h-3 
                  bg-green-500 rounded-full border-1 border-black"></div> */}
              </div>
              
              <div className="flex-1 max-w-sm">
                <div className="flex items-center space-x-2">
                  <span 
                    className="font-bold text-sm text-white/80">
                    {comment.handle}
                  </span>
                </div>
                
                <div>
                  {comment.message.includes('diamonds') ? (
                    <div className="flex items-center space-x-2 bg-yellow-500/10 
                      px-3 py-1.5 rounded-full inline-block">
                      <Diamond className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-100 text-sm">{truncateText(comment.message, 100)}</span>
                    </div>
                  ) : (
                    <span className="text-[14px] leading-tight text-white/70">
                      {truncateText(comment.message, 100)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}