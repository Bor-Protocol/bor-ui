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
/*to be removed 
  useEffect(() => {
    (window as any).addChatMessage = (message: string) => addComment(message, true);
    return () => {
      delete (window as any).addChatMessage;
    };
  }, [addComment]);

*/
 

 


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
              const trimmedMessage = newMessage.chatContent.trim();
            
              // Validate message
             // const validation = validateMessage(trimmedMessage);
            

              // Sanitize message before sending
             // const sanitizedMessage = sanitizeMessage(trimmedMessage);
              addComment(trimmedMessage,newMessage.avatar,newMessage.username);
                 // Trigger animation on number change
       
          }
      }
  };
  const VITE_TWITTER_ENABLED =  import.meta.env.VITE_TWITTER_ENABLED;
  console.log('VITE_TWITTER_ENABLED',VITE_TWITTER_ENABLED);
  if (VITE_TWITTER_ENABLED === 'true') {
    window.addEventListener('message', messageHandler);
  }

  return () => {
    if (VITE_TWITTER_ENABLED === 'true') {
      window.removeEventListener('message', messageHandler);
    }
  };
}, []);

// Handle window resize
useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 768);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

// for twitch
useEffect(() => {
 
  


 // Function to handle messages
 const handleMessage = async (_channel: string, userstate: ChatUserstate, message: string, self: boolean) => {
  if (self) return; // Ignore messages from the bot

  // Fetch avatar for the user
  const avatar = await fetchUserAvatar(userstate['user-id'] || '');

  // Verify the payload has the expected structure
  const newMessage: ChatMessage = {
    username:  userstate['display-name'] || 'Unknown',
    chatContent: message,
    timestamp: new Date().toISOString(),
    avatar: avatar || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png' // Default Twitch avatar
  };

  const trimmedMessage = newMessage.chatContent.trim();
      
  // Validate message
 // const validation = validateMessage(trimmedMessage);


  // Sanitize message before sending
 // const sanitizedMessage = sanitizeMessage(trimmedMessage);
  addComment(trimmedMessage,newMessage.avatar,newMessage.username);
     // Trigger animation on number change




};

// Expose test function to browser console
if (typeof window !== 'undefined') {
  (window as any).testTwitchMessage = async () => {
    console.log('🧪 Testing Twitch message from console...');
    
    const mockUserstate = {
      'user-id': '123456789',
      'display-name': 'TestUser'
    } as ChatUserstate;
    
    await handleMessage('#testchannel', mockUserstate, 'testing', false);
    console.log('✅ Test message sent from console!');
  };
}

// Handle connection
const handleConnect = () => {
setIsConnected(true);
console.log('Connected to Twitch chat!');
};

// Handle disconnection
const handleDisconnect = () => {
setIsConnected(false);
console.log('Disconnected from Twitch chat!');
};
const TWITCH_ENABLED =  import.meta.env.VITE_TWITCH_ENABLED;
console.log('TWITCH_ENABLED',TWITCH_ENABLED);
if (TWITCH_ENABLED === 'true') {
// Create a new client instance
const client = new Client({
  options: { debug: true },
  connection: {
      secure: true,
      reconnect: true
  },
  identity: {
      username: import.meta.env.VITE_TWITCH_BOT_USERNAME,
      password: import.meta.env.VITE_TWITCH_ACCESS_TOKEN
  },
  channels: [import.meta.env.VITE_TWITCH_CHANNEL]
});

   // Add event listeners
   client.on('message', handleMessage);
   client.on('connected', handleConnect);
   client.on('disconnected', handleDisconnect);

   // Connect to Twitch
   client.connect().catch(console.error);
    

   // Cleanup function
   return () => {
  
       client.removeListener('message', handleMessage);
       client.removeListener('connected', handleConnect);
       client.removeListener('disconnected', handleDisconnect);
       client.disconnect();
    }
   };
}, []);



  


  const handleSendMessage = () => {
    if (inputMessage.trim() && username.trim()) {
      // Use empty string instead of null for avatar - we'll generate it based on username
      addComment(inputMessage.trim(), '', username);
      setInputMessage('');
      
      // Auto-hide input on mobile after sending message
      if (isMobile && onToggle) {
        setTimeout(() => {
          onToggle();
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

  // If not visible on mobile, show only a floating toggle button
  if (!isVisible && isMobile) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 10000
      }}>
        <button
          onClick={onToggle}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            border: 'none',
            color: 'white',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation',
            WebkitTapHighlightColor: 'transparent'
          }}
        >
          💬
        </button>
      </div>
    );
  }

  return (
    <div style={{ 
      background: isMobile ? 'rgba(0, 0, 0, 0.85)' : 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      borderLeft: isMobile ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: isMobile ? '20px 20px 0 0' : '0',
      padding: isMobile ? '8px 12px 12px' : '16px',
      height: 'auto',
      // Mobile optimizations - smaller and more compact
      maxHeight: isMobile ? '25vh' : 'auto',
      position: 'relative',
      width: '100%',
      // Animation for mobile
      transform: isMobile && !isVisible ? 'translateY(100%)' : 'translateY(0)',
      transition: 'transform 0.3s ease-in-out'
    }}>
      {/* Mobile header with toggle and handle bar */}
      {isMobile && (
        <>
          <div style={{
            position: 'absolute',
            top: '6px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '32px',
            height: '3px',
            backgroundColor: 'rgba(255, 255, 255, 0.4)',
            borderRadius: '2px'
          }} />
          
          {/* Hide button for mobile - more subtle */}
          <button
            onClick={onToggle}
            style={{
              position: 'absolute',
              top: '8px',
              right: '12px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '16px',
              padding: '6px 10px',
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '11px',
              cursor: 'pointer',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          >
            ✕
          </button>
        </>
      )}

      <div style={{ marginBottom: '12px' }}>
        {/* Username input - ultra compact for mobile */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isMobile ? '6px' : '8px', 
          marginBottom: isMobile ? '6px' : '12px',
          flexWrap: 'nowrap'
        }}>
          <div style={{
            width: isMobile ? '24px' : '32px',
            height: isMobile ? '24px' : '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: isMobile ? '11px' : '14px',
            fontWeight: 'bold',
            color: 'white',
            flexShrink: 0
          }}>
            {(username || 'G').charAt(0).toUpperCase()}
          </div>
          {!isUsernameSet ? (
            <>
              <input
                type="text"
                placeholder="Enter your name"
                value={username}
                onChange={(e) => {
                  const value = e.target.value;
                  // Limit username to 15 characters
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
                  width: isMobile ? '120px' : 'auto',
                  flex: isMobile ? 'none' : 1,
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: isMobile ? '12px' : '6px',
                  padding: isMobile ? '2px 10px' : '6px 10px',
                  fontSize: isMobile ? '12px' : '14px',
                  color: 'rgba(255, 255, 255, 0.9)',
                  outline: 'none',
                  height: isMobile ? '24px' : 'auto',
                  lineHeight: isMobile ? '20px' : 'normal'
                }}
              />
              <button
                onClick={handleUsernameSubmit}
                disabled={!username.trim()}
                style={{
                  padding: isMobile ? '2px 8px' : '6px 12px',
                  background: username.trim() ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(255, 255, 255, 0.15)',
                  border: 'none',
                  borderRadius: isMobile ? '12px' : '6px',
                  color: 'white',
                  fontSize: isMobile ? '11px' : '12px',
                  cursor: username.trim() ? 'pointer' : 'not-allowed',
                  opacity: username.trim() ? 1 : 0.5,
                  height: isMobile ? '24px' : 'auto'
                }}
              >
                Set
              </button>
            </>
          ) : (
            <>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                flex: 1
              }}>
                <span style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  fontSize: isMobile ? '12px' : '14px',
                  fontWeight: '500'
                }}>
                  {username}
                </span>
                <button
                  onClick={handleEditUsername}
                  style={{
                    padding: '2px 6px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '4px',
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '11px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    ':hover': {
                      background: 'rgba(255, 255, 255, 0.2)',
                      color: 'rgba(255, 255, 255, 0.9)'
                    }
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                    e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
                  }}
                >
                  Edit
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Message input - single line for mobile, compact design */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end' }}>
          <textarea
            placeholder="Type a message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '20px',
              padding: isMobile ? '10px 16px' : '10px',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.95)',
              outline: 'none',
              resize: 'none',
              minHeight: isMobile ? '40px' : '60px',
              maxHeight: isMobile ? '120px' : '120px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              boxSizing: 'border-box',
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent'
            }}
          />
          
          {/* Send button - compact circular button for mobile */}
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim()}
            style={{
              width: isMobile ? '40px' : '60px',
              height: isMobile ? '40px' : '40px',
              background: inputMessage.trim() 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              borderRadius: '20px',
              color: 'white',
              fontSize: isMobile ? '16px' : '14px',
              fontWeight: 'bold',
              cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s',
              opacity: inputMessage.trim() ? 1 : 0.5,
              touchAction: 'manipulation',
              WebkitTapHighlightColor: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {isMobile ? '→' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}