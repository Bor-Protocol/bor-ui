import { Diamond } from 'lucide-react';
import { useScene } from '../../contexts/ScenesContext';
import { useChatVisibility } from '../../contexts/ChatVisibilityContext';
import { useEffect, useRef, useState } from 'react';

const truncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

export function LiveChat() {
  const { comments } = useScene();
  const { isChatInputVisible, isMobile } = useChatVisibility();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  
  console.log('LiveChat rendering with', comments.length, 'comments');

  const toggleMessageExpansion = (messageId: string) => {
    console.log('Toggling message expansion for:', messageId);
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // Auto-scroll to bottom on mobile when new messages arrive
  useEffect(() => {
    if (isMobile && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [comments.length, isMobile]);

  // Calculate how many messages to show based on screen size and input visibility
  const maxMessages = isMobile ? 4 : 7; // Show 4 recent messages on mobile, 7 on desktop
  const messageMaxLength = isMobile ? 60 : 100; // Slightly longer messages on mobile
 
  return (
    <div className={`z-[0] pointer-events-none
      ${isMobile 
        ? '' // No positioning on mobile - controlled by parent
        : 'absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent' // Keep desktop background
      }`}>
      <div 
        ref={scrollContainerRef}
        className={isMobile 
          ? "h-40 overflow-y-auto scrollbar-hide space-y-2 flex flex-col pb-2" // Mobile: taller container (160px) with padding
          : "mb-4 overflow-hidden space-y-0.5" // Desktop: unchanged
        }>
        {(isMobile ? comments : comments.slice(Math.max(comments.length - maxMessages, 0)))
          .map((comment) => (
            <div
              key={comment.id}
              className={`group flex items-start transition-all duration-300 ease-out animate-slide-up
                ${isMobile 
                  ? 'space-x-2 pointer-events-auto' // TikTok-style: minimal styling
                  : 'space-x-3 p-1 rounded-lg pointer-events-auto'
                }`}
            >
              <div className="relative flex-shrink-0">
                {comment.avatar ? (
                  <img 
                    src={comment.avatar} 
                    alt="User Avatar" 
                    className={`rounded-full transition-all
                      ${isMobile 
                        ? 'w-8 h-8 ring-1 ring-white/30' // Smaller, subtle ring on mobile
                        : 'w-8 h-8 ring-2 ring-white-500/50 group-hover:ring-white-500'
                      }`}
                  />
                ) : (
                  // Generate avatar from first letter of username
                  <div 
                    className={`rounded-full transition-all flex items-center justify-center
                      ${isMobile 
                        ? 'w-8 h-8 ring-1 ring-white/30' // Smaller, subtle ring on mobile
                        : 'w-8 h-8 ring-2 ring-white-500/50 group-hover:ring-white-500'
                      }`}
                    style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontSize: isMobile ? '12px' : '14px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}
                  >
                    {(comment.handle || 'G').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className={`flex-1 min-w-0 ${isMobile ? 'max-w-none' : 'max-w-sm'}`}>
                {isMobile ? (
                  // Mobile: clickable expandable message bubbles
                  <div 
                    className="bg-black/60 backdrop-blur-sm rounded-2xl px-3 py-2 max-w-[280px] min-w-[120px] flex-shrink-0 cursor-pointer hover:bg-black/70 transition-all duration-200 select-none pointer-events-auto"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleMessageExpansion(comment.id);
                    }}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                    title="Click to expand message"
                  >
                    <div className="flex flex-col space-y-1">
                      <span className="font-semibold text-white text-xs truncate max-w-[100px]">
                        {comment.handle.length > 8 ? comment.handle.substring(0, 8) + '...' : comment.handle}
                      </span>
                      <div className="text-white/90 text-xs leading-relaxed break-words">
                        {comment.message.includes('diamonds') ? (
                          <div className="flex items-start space-x-1">
                            <Diamond className="w-3 h-3 text-yellow-400 flex-shrink-0 mt-0.5" />
                            <span className="text-yellow-100">
                              {expandedMessages.has(comment.id) 
                                ? comment.message 
                                : truncateText(comment.message, messageMaxLength)
                              }
                            </span>
                          </div>
                        ) : (
                          <span className="whitespace-pre-wrap">
                            {expandedMessages.has(comment.id) 
                              ? comment.message 
                              : truncateText(comment.message, messageMaxLength)
                            }
                          </span>
                        )}
                        {!expandedMessages.has(comment.id) && comment.message.length > messageMaxLength && (
                          <span className="text-white/40 text-xs"> ...click to expand</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Desktop: keep existing style
                  <>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-white/80">
                        {comment.handle}
                      </span>
                    </div>
                    
                    <div className="mt-0.5">
                      {comment.message.includes('diamonds') ? (
                        <div className="flex items-center space-x-2 bg-yellow-500/10 px-3 py-1.5 rounded-full inline-block">
                          <Diamond className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                          <span className="text-yellow-100 text-sm break-words">
                            {truncateText(comment.message, messageMaxLength)}
                          </span>
                        </div>
                      ) : (
                        <span className="leading-tight text-white/70 break-words text-[14px]">
                          {truncateText(comment.message, messageMaxLength)}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}