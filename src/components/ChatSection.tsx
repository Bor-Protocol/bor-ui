import './WebSocketProvider';  // Import this first!

import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import { useScene } from '../contexts/ScenesContext';
// Removed unused tmi.js imports

interface ChatSectionProps {
  onClose?: () => void;
  isVisible?: boolean;
  onToggle?: () => void;
}

interface ChatMessage {
  username: string;
  chatContent: string;
  timestamp: string;
  avatar: string;
}

// Enhanced MessageEvent interface for better type safety
interface SecureMessageEvent extends MessageEvent {
  data: {
    type: string;
    payload: ChatMessage;
  };
  origin: string;
}

function ChatSectionComponent({ isVisible = true, onToggle }: ChatSectionProps) {
  const { addComment } = useScene();
  const [, setIsConnected] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState(() => {
    // Load username from localStorage on component mount
    const savedUsername = localStorage.getItem('chatUsername');
    return savedUsername || '';
  });
  const [isUsernameSet, setIsUsernameSet] = useState(() => {
    // Check if username is already set
    return localStorage.getItem('chatUsername') !== null;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // SECURITY FIX: Removed Twitch API credentials and unused fetchUserAvatar function
  // Avatar fetching should be handled by backend services to protect API credentials

// SECURITY FIX: Secure postMessage handler with origin validation
useEffect(() => {
  // Get allowed origins from environment variables
  const allowedOrigins = import.meta.env.VITE_ALLOWED_MESSAGE_ORIGINS?.split(',').map(origin => origin.trim()) || [];
  
  // Add current origin as fallback for development
  if (allowedOrigins.length === 0) {
    allowedOrigins.push(window.location.origin);
  }

  const messageHandler = (event: MessageEvent) => {
    // SECURITY: Validate message origin
    if (!allowedOrigins.includes(event.origin)) {
      console.warn('Rejected message from unauthorized origin:', event.origin);
      return;
    }

    // SECURITY: Validate event structure
    if (!event.data || typeof event.data !== 'object') {
      console.warn('Invalid message format received');
      return;
    }

    console.log('Received message from authorized origin:', event.origin, event.data);

    if (event.data?.type === 'NEW_CHAT_DATA' && event.data?.payload) {
      const payload = event.data.payload;
      
      // SECURITY: Strict payload validation with type checking
      if (
        payload &&
        typeof payload === 'object' &&
        typeof payload.username === 'string' &&
        typeof payload.chatContent === 'string' &&
        typeof payload.timestamp === 'string' &&
        payload.username.length > 0 &&
        payload.username.length <= 50 && // Limit username length
        payload.chatContent.length > 0 &&
        payload.chatContent.length <= 500 // Limit message length
      ) {
        // SECURITY: Sanitize inputs (basic XSS prevention)
        const sanitizedMessage: ChatMessage = {
          username: payload.username.replace(/[<>"'&]/g, ''), // Remove potential HTML chars
          chatContent: payload.chatContent.replace(/[<>]/g, ''), // Remove HTML tags
          timestamp: payload.timestamp,
          avatar: typeof payload.avatar === 'string' ? payload.avatar : ''
        };
        
        console.log('Processed secure message:', sanitizedMessage);
        addComment(sanitizedMessage.chatContent, false, sanitizedMessage.username, sanitizedMessage.avatar);
      } else {
        console.warn('Invalid or unsafe message payload:', payload);
      }
    }
  };

  window.addEventListener('message', messageHandler);

  return () => {
    window.removeEventListener('message', messageHandler);
  };
}, [addComment]);


  // Update mobile state on window resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const handleSendMessage = useCallback(async () => {
    if (inputMessage.trim() && username.trim()) {
      try {
        console.log('Sending message:', inputMessage.trim());
        
        // Add the message locally
        addComment(inputMessage.trim(), false, username.trim());
        
        // Clear input and show sending state
        const sentMessage = inputMessage.trim();
        setInputMessage('');

      } catch (error) {
        console.error('Error sending message:', error);
        
        // Restore the message on error
        setInputMessage(inputMessage);
        
        // Show error message briefly
        setTimeout(() => {
          // Could add error handling UI here
        }, 500); // Hide after 500ms to show the message was sent
      }
    }
  }, [inputMessage, username, addComment]);

  const handleUsernameSubmit = useCallback(() => {
    if (username.trim()) {
      localStorage.setItem('chatUsername', username.trim());
      setIsUsernameSet(true);
    }
  }, [username]);

  const handleEditUsername = useCallback(() => {
    setIsUsernameSet(false);
    setUsername('');
    localStorage.removeItem('chatUsername');
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  console.log('ChatSection is rendering!', { username, inputMessage, isMobile }); // Debug log

  // Always show the chat input (no floating button)
  
  // Memoize main container styles
  const containerStyle = useMemo(() => ({
    background: isMobile 
      ? 'rgba(0, 0, 0, 0.8)'
      : 'rgba(0, 0, 0, 0.9)',
    border: isMobile ? 'none' : '3px solid #FFD700',
    borderRadius: '0px',
    boxShadow: isMobile ? 'none' : '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.8)',
    padding: isMobile ? '8px 12px 12px' : '12px',
    height: 'auto',
    maxHeight: isMobile ? '25vh' : 'auto',
    position: 'relative' as const,
    width: '100%',
    fontFamily: 'monospace'
  }), [isMobile]);

  return (
    <div style={containerStyle}>


{isMobile ? (
        /* Mobile layout: username above, input form below */
        <div style={{ marginBottom: '8px' }}>
          {/* Username section above */}
          {!isUsernameSet ? (
            <div style={{ marginBottom: '6px' }}>
              <input
                type="text"
                placeholder="ENTER USERNAME"
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  const limitedValue = value.length > 15 ? value.substring(0, 15) : value;
                  setUsername(limitedValue);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && username.trim()) {
                    e.preventDefault();
                    handleUsernameSubmit();
                  }
                }}
                maxLength={15}
                style={{
                  width: '100%',
                  background: 'rgba(0, 0, 0, 0.8)',
                  border: '1px solid #FFD700',
                  borderRadius: '0px',
                  padding: '6px 8px',
                  fontSize: '10px',
                  color: '#FFD700',
                  outline: 'none',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  marginBottom: '4px'
                }}
              />
              <button
                onClick={handleUsernameSubmit}
                disabled={!username.trim()}
                style={{
                  width: '100%',
                  padding: '6px 8px',
                  background: username.trim() ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.3)',
                  border: '1px solid #FFD700',
                  borderRadius: '0px',
                  color: username.trim() ? '#000' : '#666',
                  fontSize: '9px',
                  cursor: username.trim() ? 'pointer' : 'not-allowed',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}
              >
                SET USERNAME
              </button>
            </div>
          ) : (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px',
              marginBottom: '4px'
            }}>
              <span style={{
                color: '#FFD700',
                fontSize: '12px',
                fontWeight: 'bold',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
              }}>
                USER: {username}
              </span>
              <button
                onClick={handleEditUsername}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#FFD700',
                  fontSize: '14px',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '18px',
                  height: '18px'
                }}
                title="Edit username"
              >
                ✏️
              </button>
            </div>
          )}

          {/* Input form below */}
          <div style={{ display: 'flex', gap: '4px', alignItems: 'stretch' }}>
            <textarea
              placeholder="TALK TO HIKARI..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.8)',
                border: '1px solid #FFD700',
                borderRadius: '0px',
                padding: '10px',
                fontSize: '11px',
                color: 'rgba(255, 255, 255, 0.9)',
                outline: 'none',
                resize: 'none',
                height: '44px',
                fontFamily: 'monospace',
                lineHeight: '1.2',
                boxSizing: 'border-box',
                display: 'flex',
                alignItems: 'center'
              }}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !username.trim()}
              style={{
                padding: '0px 12px',
                background: (inputMessage.trim() && username.trim()) ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.3)',
                border: '1px solid #FFD700',
                borderRadius: '0px',
                color: (inputMessage.trim() && username.trim()) ? '#000' : '#666',
                fontSize: '12px',
                cursor: (inputMessage.trim() && username.trim()) ? 'pointer' : 'not-allowed',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxSizing: 'border-box'
              }}
            >
              SEND
            </button>
          </div>
        </div>
      ) : (
        /* Desktop layout: original layout */
        <div style={{ marginBottom: '8px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            marginBottom: '8px',
            flexWrap: 'nowrap'
          }}>
            {!isUsernameSet ? (
              <>
                <input
                  type="text"
                  placeholder="ENTER USERNAME"
                  value={username}
                  onChange={(e) => {
                    const value = e.target.value;
                    const limitedValue = value.length > 15 ? value.substring(0, 15) : value;
                    setUsername(limitedValue);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && username.trim()) {
                      e.preventDefault();
                      handleUsernameSubmit();
                    }
                  }}
                  maxLength={15}
                  style={{
                    flex: 1,
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '2px solid #FFD700',
                    borderRadius: '0px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    color: '#FFD700',
                    outline: 'none',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}
                />
                <button
                  onClick={handleUsernameSubmit}
                  disabled={!username.trim()}
                  style={{
                    padding: '6px 12px',
                    background: username.trim() ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.3)',
                    border: '2px solid #FFD700',
                    borderRadius: '0px',
                    color: username.trim() ? '#000' : '#666',
                    fontSize: '11px',
                    cursor: username.trim() ? 'pointer' : 'not-allowed',
                    fontFamily: 'monospace',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}
                >
                  SET
                </button>
              </>
            ) : (
              <>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flex: 1
                }}>
                  <span style={{
                    color: '#FFD700',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
                  }}>
                    USER: {username}
                  </span>
                  <button
                    onClick={handleEditUsername}
                    style={{
                      padding: '1px 2px',
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #FFD700',
                      borderRadius: '0px',
                      color: '#FFD700',
                      fontSize: '8px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      minWidth: '18px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255, 215, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(0, 0, 0, 0.8)';
                    }}
                  >
                    EDIT
                  </button>
                </div>
              </>
            )}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
            <textarea
              placeholder="TALK TO HIKARI..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                flex: 1,
                background: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid #FFD700',
                borderRadius: '0px',
                padding: '10px 14px',
                fontSize: '12px',
                color: 'rgba(255, 255, 255, 0.9)',
                outline: 'none',
                resize: 'none',
                minHeight: '40px',
                maxHeight: '80px',
                fontFamily: 'monospace',
                lineHeight: '1.4'
              }}
              rows={2}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !username.trim()}
              style={{
                padding: '10px 16px',
                background: (inputMessage.trim() && username.trim()) ? 'rgba(255, 215, 0, 0.9)' : 'rgba(255, 215, 0, 0.3)',
                border: '2px solid #FFD700',
                borderRadius: '0px',
                color: (inputMessage.trim() && username.trim()) ? '#000' : '#666',
                fontSize: '11px',
                cursor: (inputMessage.trim() && username.trim()) ? 'pointer' : 'not-allowed',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                minHeight: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              SEND
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Export memoized component
export const ChatSection = memo(ChatSectionComponent);