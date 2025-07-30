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



  




  return (
    <div className="h-full bg-gradient-to-b from-slate-900/95 to-slate-800/95 backdrop-blur-md">
      <div className="p-4 border-b border-white/10">
        <div className="rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
          <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-2xl p-1">
            <div className="bg-slate-900/95 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <h3 className="text-sm font-semibold bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  💬 Live Chat
                </h3>
                <span className="text-xs text-slate-400">Connected</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <div className="text-center text-slate-400 text-sm">
          <div className="rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
            <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-2xl p-1">
              <div className="bg-slate-900/95 rounded-2xl p-6">
                <div className="mb-3">🌊</div>
                <p className="font-medium mb-1">Social Chat Features</p>
                <p className="text-xs text-slate-500">
                  Twitch and Twitter integration available
                </p>
                <div className="mt-4 text-xs text-slate-600">
                  Test via console: <code className="bg-slate-800 px-1 rounded">testTwitchMessage()</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}