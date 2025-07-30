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
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={placeholder}
            disabled={isSubmitting}
            rows={3}
            className="w-full px-4 py-3 bg-transparent border-none text-white placeholder-slate-400 focus:outline-none resize-none disabled:opacity-50 transition-all duration-200"
            maxLength={500}
          />
          {message.length > 400 && (
            <div className="absolute right-3 bottom-3 text-xs text-slate-400">
              {message.length}/500
            </div>
          )}
        </div>
        <button
          type="submit"
          disabled={!message.trim() || isSubmitting}
          className="group relative overflow-hidden w-full py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>✨ Sending...</span>
              </>
            ) : (
              <>
                <span>🚀 Send Message</span>
              </>
            )}
          </span>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </button>
      </form>
    </div>
  );
}