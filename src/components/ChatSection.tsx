import './WebSocketProvider';  // Import this first!

import { useState, useEffect, useRef } from 'react';
import { X, Heart } from 'lucide-react';
import { useScene } from '../contexts/ScenesContext';
import { useUser } from '../contexts/UserContext';
import { validateMessage, sanitizeMessage } from '../utils/messageValidation';
import { Client } from 'tmi.js';



interface ChatSectionProps {
  onClose?: () => void;
}

interface Message {
  id: string;
  user: string;
  message: string;
  avatar: string;
  timestamp: number;
  isSystem?: boolean;
  badges?: Badge[];
  messageType?: 'gift' | 'regular' | 'system';
  metadata?: {
    txHash?: string;
    giftName?: string;
    giftCount?: number;
    coinsTotal?: number;
    icon?: string;
    avatar?: string;
    handle?: string;
  };
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

interface Badge {
  icon: string;
  text?: string;
  type: 'level' | 'rank' | 'special';
  color?: string;
}

const getBadgeStyle = (badge: Badge) => {
  const baseStyle = "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-md";

  if (badge.type === 'level') {
    return `${baseStyle} bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300`;
  } else if (badge.type === 'rank') {
    return `${baseStyle} bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300`;
  } else if (badge.color) {
    return `${baseStyle} ${badge.color}`;
  }

  return `${baseStyle} bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300`;
};



const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    user: 'IM|@akura🎮',
    message: '999',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=32&h=32&fit=crop',
    timestamp: Date.now(),
    badges: [
      { icon: '💎', text: '19', type: 'level' },
      { icon: '❤️', text: 'III', type: 'rank' }
    ]
  },
  {
    id: '2',
    user: 'Yohana Gomez',
    message: '@👨🏻PAPI👨🏻',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop',
    timestamp: Date.now(),
    badges: [
      { icon: '💎', text: '8', type: 'level' },
      { icon: '❤️', text: 'I', type: 'rank' }
    ]
  }
];

const SIMULATED_MESSAGES = [
  {
    user: 'Carlos_23',
    message: 'Hello everyone! 👋',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop',
    badges: [{ icon: '💎', text: '25', type: 'level' }]
  },
  {
    user: 'Maria.Luz',
    message: '❤️❤️❤️',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop',
    badges: [
      { icon: '💎', text: '11', type: 'level' },
      { icon: '❤️', text: 'I', type: 'rank' }
    ]
  },
  {
    user: 'Gaming_Pro',
    message: 'Amazing stream!',
    avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=32&h=32&fit=crop',
    badges: [
      { icon: '🎯', text: 'No. 2', type: 'special', color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300' }
    ]
  }
];

export function ChatSection({ onClose }: ChatSectionProps) {
  const { comments, addComment } = useScene();
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);
  const { userProfile } = useUser();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(Date.now());
  const [showMultiplier, setShowMultiplier] = useState(false);
  const multiplierTimeoutRef = useRef<NodeJS.Timeout>();
  const [isMultiplierAnimating, setIsMultiplierAnimating] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showError, setShowError] = useState(false);

  const [localMessages, setLocalMessages] = useState<Array<{
    id: string;
    message: string;
    isSystem: boolean;
    timestamp: number;
  }>>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);



  // // console.log({ topViewers });
  const [isConnected, setIsConnected] = useState(false);
  const clientIdRef = useRef(import.meta.env.VITE_TWITCH_CLIENT_ID);
 // Function to fetch user avatar
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

  useEffect(() => {
    (window as any).addChatMessage = (message: string) => addComment(message, true);
    return () => {
      delete (window as any).addChatMessage;
    };
  }, [addComment]);


  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments]);

 


 
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
              setChatMessages(prevMessages => [...prevMessages, newMessage]);
              const trimmedMessage = newMessage.chatContent.trim();
            
              // Validate message
             // const validation = validateMessage(trimmedMessage);
            

              // Sanitize message before sending
             // const sanitizedMessage = sanitizeMessage(trimmedMessage);
              addComment(trimmedMessage,newMessage.avatar,newMessage.username);
                 // Trigger animation on number change
              setIsMultiplierAnimating(true);
              setTimeout(() => setIsMultiplierAnimating(false), 100);
       
              setNewMessage('');
              setCanSend(false);
              setTimeLeft(1);
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

useEffect(() => {
 
  


 // Function to handle messages
 const handleMessage = async (channel, tags, message, self) => {
  if (self) return; // Ignore messages from the bot

  // Fetch avatar for the user
  const avatar = await fetchUserAvatar(tags['user-id']);

  // Verify the payload has the expected structure
  const newMessage: ChatMessage = {
    username:  tags['display-name'],
    chatContent: message,
    timestamp: new Date(),
    avatar: avatar || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png' // Default Twitch avatar
  };
  setChatMessages(prevMessages => [...prevMessages, newMessage]);

  const trimmedMessage = newMessage.chatContent.trim();
      
  // Validate message
 // const validation = validateMessage(trimmedMessage);


  // Sanitize message before sending
 // const sanitizedMessage = sanitizeMessage(trimmedMessage);
  addComment(trimmedMessage,newMessage.avatar,newMessage.username);
     // Trigger animation on number change
  setIsMultiplierAnimating(true);
  setTimeout(() => setIsMultiplierAnimating(false), 100);
  setNewMessage('');
  setCanSend(false);
  setTimeLeft(1);



};

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

  // Add cooldown timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      if (timeLeft > 0) {
        setTimeLeft(time => time - 1);
      } else {
        setCanSend(true);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  




  return (
 <div>
  <div>
    <h1>Chat</h1>
  </div>
 </div>
  );
}