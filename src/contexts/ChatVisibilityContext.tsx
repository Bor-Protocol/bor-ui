import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';

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
  const [isChatInputVisible, setIsChatInputVisibleState] = useState(false);

  // Memoize the setter to maintain reference stability
  const setIsChatInputVisible = useCallback((visible: boolean) => {
    setIsChatInputVisibleState(visible);
  }, []);

  // Handle window resize with memoized handler
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
  }, [setIsChatInputVisible]);

  // Initialize chat visibility based on screen size
  useEffect(() => {
    setIsChatInputVisible(!isMobile); // Hidden on mobile by default, visible on desktop
  }, [isMobile]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    isChatInputVisible,
    setIsChatInputVisible,
    isMobile
  }), [isChatInputVisible, setIsChatInputVisible, isMobile]);

  return (
    <ChatVisibilityContext.Provider value={value}>
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