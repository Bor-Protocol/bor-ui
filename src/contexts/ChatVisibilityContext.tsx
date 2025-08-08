import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ChatVisibilityContextType {
  isChatInputVisible: boolean;
  setIsChatInputVisible: (visible: boolean) => void;
  isMobile: boolean;
}

const ChatVisibilityContext = createContext<ChatVisibilityContextType | undefined>(undefined);

interface ChatVisibilityProviderProps {
  children: ReactNode;
}

export function ChatVisibilityProvider({ children }: ChatVisibilityProviderProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isChatInputVisible, setIsChatInputVisible] = useState(false);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // On desktop, always show chat input
      if (!mobile) {
        setIsChatInputVisible(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Initialize chat visibility based on screen size
  useEffect(() => {
    setIsChatInputVisible(!isMobile); // Hidden on mobile by default, visible on desktop
  }, [isMobile]);

  return (
    <ChatVisibilityContext.Provider value={{
      isChatInputVisible,
      setIsChatInputVisible,
      isMobile
    }}>
      {children}
    </ChatVisibilityContext.Provider>
  );
}

export function useChatVisibility() {
  const context = useContext(ChatVisibilityContext);
  if (context === undefined) {
    throw new Error('useChatVisibility must be used within a ChatVisibilityProvider');
  }
  return context;
}