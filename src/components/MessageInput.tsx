import { useState } from 'react';
import { useScene } from '../contexts/ScenesContext';
import { useAuth } from '../contexts/AuthContext';

interface MessageInputProps {
  placeholder?: string;
  className?: string;
}

export function MessageInput({ 
  placeholder = "Type a message...", 
  className = "" 
}: MessageInputProps) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addComment } = useScene();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSubmitting) return;
    
    const trimmedMessage = message.trim();
    setIsSubmitting(true);
    
    try {
      // Use the same addComment method that handleMessage uses
      // This will add the message to the current agent's chat
      // Use authenticated user info if available
      const userAvatar = user?.avatar || 'https://static-cdn.jtvnw.net/user-default-pictures-uv/13e5fa74-defa-11e9-809c-784f43822e80-profile_image-70x70.png';
      const userHandle = user ? (user.name || user.email.split('@')[0]) : 'Anonymous';
      
      addComment(
        trimmedMessage,
        userAvatar,
        userHandle,
        false, // Not system message
        true   // Emit to server
      );
      
      // Clear the input
      setMessage('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isSubmitting}
            className="w-full px-4 py-3 pr-16 bg-gray-900/90 border border-gray-500 rounded-xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 disabled:opacity-50 transition-all duration-200"
            maxLength={500}
          />
          {message.length > 400 && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400">
              {message.length}/500
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-lg hover:shadow-xl disabled:shadow-none min-w-[80px]"
        >
          {isSubmitting ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Sending</span>
            </div>
          ) : (
            'Send'
          )}
        </button>
      </form>
    </div>
  );
}