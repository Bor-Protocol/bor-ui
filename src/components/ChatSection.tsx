import './WebSocketProvider';  // Import this first!

import { useState, useEffect, useRef } from 'react';
import { useScene } from '../contexts/ScenesContext';
import { Client, ChatUserstate } from 'tmi.js';

interface ChatSectionProps {
  onClose?: () => void;
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









export function ChatSection({  }: ChatSectionProps) {
  const { addComment } = useScene();
  const [, setIsConnected] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [username, setUsername] = useState('Guest');
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
    if (inputMessage.trim()) {
      const defaultAvatar = 'https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png';
      addComment(inputMessage.trim(), defaultAvatar, username);
      setInputMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  console.log('ChatSection is rendering!', { username, inputMessage, isMobile }); // Debug log

  return (
    <div style={{ 
      background: 'rgba(17, 24, 39, 0.95)',
      backdropFilter: 'blur(12px)',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
      padding: '16px',
      height: 'auto'
    }}>
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            fontWeight: 'bold',
            color: 'white',
            flexShrink: 0
          }}>
            {username.charAt(0).toUpperCase()}
          </div>
          <input
            type="text"
            placeholder="Your name"
            value={username}
            onChange={(e) => setUsername(e.target.value || 'Guest')}
            style={{
              flex: 1,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '6px',
              padding: '6px 10px',
              fontSize: '13px',
              color: 'rgba(255, 255, 255, 0.9)',
              outline: 'none'
            }}
          />
        </div>
        
        <textarea
          placeholder="Send a message..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px',
            padding: '10px',
            fontSize: '14px',
            color: 'rgba(255, 255, 255, 0.95)',
            outline: 'none',
            resize: 'vertical',
            minHeight: '60px',
            maxHeight: '120px',
            marginBottom: '10px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            boxSizing: 'border-box'
          }}
        />
        
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim()}
          style={{
            width: '100%',
            background: inputMessage.trim() 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
              : 'rgba(255, 255, 255, 0.1)',
            border: 'none',
            borderRadius: '8px',
            padding: '10px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            opacity: inputMessage.trim() ? 1 : 0.5
          }}
        >
          Send Message
        </button>
      </div>
    </div>
  );
}