import { Diamond } from 'lucide-react';
import { useScene } from '../../contexts/ScenesContext';
import { useChatVisibility } from '../../contexts/ChatVisibilityContext';
import { useEffect, useRef, useState, useCallback, useMemo, memo } from 'react';

const truncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

function LiveChatComponent() {
  const { comments } = useScene();
  const { isChatInputVisible, isMobile } = useChatVisibility();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const [liveChatHeight, setLiveChatHeight] = useState(120); // Default small size
  const [isExpanded, setIsExpanded] = useState(false);
  const [userColors, setUserColors] = useState<Map<string, string>>(new Map());
  
  console.log('LiveChat rendering with', comments.length, 'comments');

  const toggleMessageExpansion = useCallback((messageId: string) => {
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
  }, []);

  // Auto-scroll to bottom on mobile when new messages arrive
  useEffect(() => {
    if (isMobile && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [comments.length, isMobile]);

  // Calculate how many messages to show based on screen size and input visibility
  const maxMessages = isMobile ? 50 : 50; // Show 50 messages on both mobile and desktop
  const messageMaxLength = isMobile ? 80 : 120;

  const toggleChatHeight = useCallback(() => {
    if (isExpanded) {
      // Contract to default size
      setLiveChatHeight(120);
      setIsExpanded(false);
    } else {
      // Expand to larger size
      setLiveChatHeight(300);
      setIsExpanded(true);
    }
  }, [isExpanded]);

  // Memoize the color palette
  const colorPalette = useMemo(() => [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
    '#10AC84', '#EE5A24', '#0ABDE3', '#C44569', '#F8B500'
  ], []);

  // Memoize getUserColor function
  const getUserColor = useCallback((username: string) => {
    if (userColors.has(username)) {
      return userColors.get(username)!;
    }
    
    const randomColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    setUserColors(prev => new Map(prev).set(username, randomColor));
    return randomColor;
  }, [userColors, colorPalette]);
  // Memoize main container styles
  const containerStyle = useMemo(() => ({
    background: isMobile 
      ? 'linear-gradient(180deg, rgba(0, 0, 0, 0.0) 0%, rgba(0, 0, 0, 0.9) 100%)'
      : 'rgba(0, 0, 0, 0.9)',
    border: isMobile ? 'none' : '3px solid #FFD700',
    borderRadius: '0px',
    padding: isMobile ? '4px' : '6px',
    boxShadow: isMobile ? 'none' : '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.8)',
    pointerEvents: 'none' as const,
    position: 'relative' as const
  }), [isMobile]);

  // Memoize scroll container styles
  const scrollContainerStyle = useMemo(() => ({
    height: isMobile ? `${liveChatHeight}px` : '400px',
    overflowY: 'auto' as const,
    overflowX: 'hidden' as const,
    scrollbarWidth: 'none' as const,
    msOverflowStyle: 'none' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '1px'
  }), [isMobile, liveChatHeight]);
 
  return (
    <div style={containerStyle}>
      {/* Mobile height toggle button */}
      {isMobile && (
        <div style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          zIndex: 1
        }}>
          <button
            onClick={toggleChatHeight}
            style={{
              background: 'transparent',
              border: 'none',
              borderRadius: '0px',
              color: '#333333',
              fontSize: '20px',
              fontWeight: 'bold',
              width: '28px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
              fontFamily: 'monospace'
            }}
          >
            {isExpanded ? '−' : '+'}
          </button>
        </div>
      )}
      
      {/* Gaming header bar - only on desktop */}
      {!isMobile && (
        <div style={{
          borderBottom: '2px solid #FFD700',
          marginBottom: '4px',
          padding: '2px 6px',
          background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%)'
        }}>
          <span style={{
            color: '#FFD700',
            fontSize: '10px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
          }}>
            LIVE CHAT
          </span>
        </div>
      )}
      
      <div 
        ref={scrollContainerRef}
        style={scrollContainerStyle}>
        {comments
          .map((comment) => (
            <div
              key={comment.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                padding: isMobile ? '2px 4px' : '2px 6px',
                borderLeft: '2px solid #FFD700',
                background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                pointerEvents: 'auto',
                animation: 'slideUp 0.3s ease-out',
                opacity: 1,
                cursor: isMobile ? 'pointer' : 'default'
              }}
              onClick={isMobile ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleMessageExpansion(comment.id);
              } : undefined}
            >
              <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                gap: '6px', 
                alignItems: 'baseline',
                width: '100%'
              }}>
                <span style={{
                  fontWeight: 'bold',
                  color: getUserColor(comment.handle),
                  fontSize: isMobile ? '14px' : '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  textShadow: `0 0 3px ${getUserColor(comment.handle)}80`,
                  flexShrink: 0,
                  fontFamily: 'monospace'
                }}>
                  {comment.handle.length > 12 ? comment.handle.substring(0, 12) : comment.handle}:
                </span>
                <span style={{
                  color: comment.message.includes('diamonds') ? '#FEF3C7' : 'rgba(255, 255, 255, 0.85)',
                  fontSize: isMobile ? '14px' : '11px',
                  lineHeight: '1.2',
                  fontFamily: 'monospace',
                  flex: 1
                }}>
                  {comment.message.includes('diamonds') && (
                    <Diamond style={{ 
                      width: '10px', 
                      height: '10px', 
                      color: '#FFD700', 
                      display: 'inline', 
                      verticalAlign: 'text-bottom', 
                      marginRight: '2px' 
                    }} />
                  )}
                  {isMobile ? (
                    expandedMessages.has(comment.id) 
                      ? comment.message 
                      : truncateText(comment.message, messageMaxLength)
                  ) : (
                    truncateText(comment.message, messageMaxLength)
                  )}
                  {isMobile && !expandedMessages.has(comment.id) && comment.message.length > messageMaxLength && (
                    <span style={{ 
                      color: '#FFD700', 
                      fontSize: '9px', 
                      opacity: 0.6,
                      marginLeft: '2px'
                    }}>[+]</span>
                  )}
                </span>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

// Export memoized component
export const LiveChat = memo(LiveChatComponent);