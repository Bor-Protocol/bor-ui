import './WebSocketProvider';  // Import this first!

import { useState, useEffect, useRef } from 'react';
import { useScene } from '../contexts/ScenesContext';
import { Client, ChatUserstate } from 'tmi.js';

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

interface MessageEvent {
  data: {
      type: string;
      payload: ChatMessage;
  };
}

export function ChatSection({ isVisible = true, onToggle }: ChatSectionProps) {
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

  const clientIdRef = useRef(import.meta.env.VITE_TWITCH_CLIENT_ID);

 // Function to fetch user avatar from twitch
 const fetchUserAvatar = async (userId: string): Promise<string | null> => {
  try {
      const response = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
          headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_TWITCH_ACCESS_TOKEN}`,
              'Client-Id': clientIdRef.current
          }
      });
      const data = await response.json();
      return data.data[0]?.profile_image_url;
  } catch (error) {
      console.error('Error fetching avatar:', error);
      return null;
  }
};

// for twitter
useEffect(() => {

  const messageHandler = (event: MessageEvent) => {
      console.log('Received message:', event.data); // Debug log

      if (event.data?.type === 'NEW_CHAT_DATA' && event.data?.payload) {
          const payload = event.data.payload;
          
          // Verify the payload has the expected structure
          if (payload.username && payload.chatContent && payload.timestamp) {
              const newMessage: ChatMessage = {
                  username: payload.username,
                  chatContent: payload.chatContent,
                  timestamp: payload.timestamp,
                  avatar: payload.avatar
              };
              
              console.log('Processed message:', newMessage); // Debug log
              addComment(newMessage.chatContent, false, newMessage.username, newMessage.avatar);
          } else {
              console.warn('Incomplete message payload:', payload);
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


  const handleSendMessage = async () => {
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
  };

  const handleUsernameSubmit = () => {
    if (username.trim()) {
      localStorage.setItem('chatUsername', username.trim());
      setIsUsernameSet(true);
    }
  };

  const handleEditUsername = () => {
    setIsUsernameSet(false);
    setUsername('');
    localStorage.removeItem('chatUsername');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  console.log('ChatSection is rendering!', { username, inputMessage, isMobile }); // Debug log

  // Always show the chat input (no floating button)

  return (
    <div style={{ 
      background: isMobile 
        ? 'rgba(0, 0, 0, 0.8)'
        : 'rgba(0, 0, 0, 0.9)',
      border: isMobile ? 'none' : '3px solid #FFD700',
      borderRadius: '0px',
      boxShadow: isMobile ? 'none' : '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.8)',
      padding: isMobile ? '8px 12px 12px' : '12px',
      height: 'auto',
      maxHeight: isMobile ? '25vh' : 'auto',
      position: 'relative',
      width: '100%',
      fontFamily: 'monospace'
    }}>


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