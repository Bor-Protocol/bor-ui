import  { useEffect, useState } from 'react';
import { useSceneEngine } from '../../contexts/SceneEngineContext';
import { AGENT_MAP } from '../../utils/constants';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatVisibility } from '../../contexts/ChatVisibilityContext';

export default function AIResponseDisplay() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPersisted, setIsPersisted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { currentResponse, audioRef } = useSceneEngine();
  const { isMobile } = useChatVisibility();

  const isRightSide = true;

  useEffect(() => {
    if (!currentResponse?.text) return;
    setIsVisible(true);
    setIsExpanded(false); // Reset expansion on new message
    
    // Only set timer if not already persisted
    if (!isPersisted) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 5000);
      
      return () => {
        clearTimeout(hideTimer);
      };
    }
  }, [currentResponse?.text]); // Remove isPersisted from dependencies to avoid re-running

  const handlePersistToggle = () => {
    setIsPersisted(!isPersisted);
  };

  const handleExpandToggle = () => {
    console.log('Toggle expansion clicked! Current state:', isExpanded);
    setIsExpanded(!isExpanded);
  };

  const handleHide = () => {
    setIsVisible(false);
    setIsPersisted(false);
    setIsExpanded(false);
  };

  if (!currentResponse?.text) return null;

  const { 
    text, 
    replyToUser: replyTo, 
    replyToMessage, 
    replyToHandle, 
    replyToPfp, 
    agentId 
  } = currentResponse;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          className={isMobile 
            ? "relative pointer-events-auto z-50" // Mobile: ensure pointer events work
            : `fixed ${isRightSide ? 'right-4' : 'left-4'} top-10 z-50 w-[90%] max-w-md` // Desktop: keep original
          }
        >
          {isMobile ? (
            // Mobile: interactive expandable response
            <div className={`bg-black/50 backdrop-blur-sm rounded-2xl px-3 py-2 border border-white/20 shadow-lg transition-all duration-200 ${
              isExpanded ? 'max-w-[300px]' : 'max-w-[240px]'
            }`}>
              {/* Header with controls */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">
                      {AGENT_MAP[agentId]?.name?.[0] || 'A'}
                    </span>
                  </div>
                  <span className="text-white text-xs font-semibold">
                    {AGENT_MAP[agentId]?.name || 'Bor'}
                  </span>
                </div>
                
                {/* Control buttons */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={handlePersistToggle}
                    className="w-4 h-4 flex items-center justify-center rounded text-white/60 hover:text-white/90 text-xs"
                    title={isPersisted ? "Unpin" : "Pin"}
                  >
                    {isPersisted ? '📌' : '📍'}
                  </button>
                  <button
                    onClick={handleHide}
                    className="w-4 h-4 flex items-center justify-center rounded text-white/60 hover:text-white/90 text-xs"
                    title="Hide"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Original message - clickable to expand */}
              {replyTo && replyToMessage && (
                <div 
                  className="text-white/70 text-xs mt-0.5 leading-tight overflow-hidden cursor-pointer hover:text-white/90 transition-colors select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Original message clicked, isExpanded:', isExpanded);
                    handleExpandToggle();
                  }}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                  title="Click to expand"
                >
                  <div className={isExpanded 
                    ? "whitespace-pre-wrap break-words" 
                    : "whitespace-nowrap overflow-hidden text-ellipsis"
                  }>
                    "{replyToMessage}"
                  </div>
                  {!isExpanded && replyToMessage && replyToMessage.length > 30 && (
                    <span className="text-white/40 text-xs"> ...click to expand</span>
                  )}
                </div>
              )}
              
              {/* AI Response - clickable to expand */}
              <div className="mt-2 pt-2 border-t border-white/10">
                <p 
                  className="text-white text-xs leading-tight overflow-hidden cursor-pointer hover:text-white/90 transition-colors select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('AI response clicked, isExpanded:', isExpanded);
                    handleExpandToggle();
                  }}
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    ...(isExpanded ? { whiteSpace: 'pre-wrap', wordBreak: 'break-word' } : {
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical'
                    })
                  }}
                  title="Click to expand"
                >
                  {text}
                </p>
                {!isExpanded && text.length > 80 && (
                  <span className="text-white/40 text-xs">...click to read more</span>
                )}
              </div>
              
              {/* Persist indicator */}
              {isPersisted && (
                <div className="mt-1 text-white/50 text-xs text-center">
                  📌 Pinned
                </div>
              )}
            </div>
          ) : (
            // Desktop: keep original large layout
            <div className="bg-black/20 rounded-2xl">
              {/* Agent Header */}
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-black/25 flex items-center justify-center">
                    <span className="text-white font-medium">
                      {AGENT_MAP[agentId]?.name?.[0] || 'A'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-white">
                      {AGENT_MAP[agentId]?.name || 'Bor'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Reply Context */}
              {replyTo && (
                <div className="px-4 py-2 bg-black/25">
                  <div className="flex items-center gap-2">
                    <img src={replyToPfp} alt={replyToHandle} className="w-5 h-5 rounded-full" />
                    <span className="text-sm text-white">
                      Replying to {replyToHandle}
                    </span>
                  </div>
                  {replyToMessage && (
                    <p className="mt-1 text-sm text-white/90 italic">
                      "{replyToMessage}"
                    </p>
                  )}
                </div>
              )}

              {/* Main Content */}
              <div className="p-4">
                <div className="prose prose-sm max-w-none">
                  <p className="text-white leading-relaxed font-normal">
                    {text}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}