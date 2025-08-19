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
            // Mobile: gaming style compact
            <div style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: '3px solid #FFD700',
              borderRadius: '0px',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.8)',
              padding: '8px 12px',
              maxWidth: isExpanded ? '300px' : '240px',
              transition: 'all 0.2s ease',
              fontFamily: 'monospace'
            }}>
              {/* Gaming header */}
              <div style={{
                borderBottom: '2px solid #FFD700',
                marginBottom: '6px',
                padding: '2px 4px',
                background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{
                    color: '#FFD700',
                    fontSize: '9px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                    textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
                  }}>
                    AI: {AGENT_MAP[agentId]?.name || 'BOR'}
                  </span>
                </div>
                
                {/* Gaming control buttons */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <button
                    onClick={handlePersistToggle}
                    style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #FFD700',
                      borderRadius: '0px',
                      padding: '2px 4px',
                      color: '#FFD700',
                      fontSize: '8px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                    title={isPersisted ? "UNPIN" : "PIN"}
                  >
                    {isPersisted ? 'PIN' : 'PIN'}
                  </button>
                  <button
                    onClick={handleHide}
                    style={{
                      background: 'rgba(0, 0, 0, 0.8)',
                      border: '1px solid #FFD700',
                      borderRadius: '0px',
                      padding: '2px 4px',
                      color: '#FFD700',
                      fontSize: '8px',
                      cursor: 'pointer',
                      fontFamily: 'monospace',
                      fontWeight: 'bold'
                    }}
                    title="CLOSE"
                  >
                    X
                  </button>
                </div>
              </div>

              {/* Original message - gaming style */}
              {replyTo && replyToMessage && (
                <div 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExpandToggle();
                  }}
                  style={{
                    color: 'rgba(255, 255, 255, 0.7)',
                    fontSize: '10px',
                    marginTop: '4px',
                    lineHeight: '1.2',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: 'monospace',
                    padding: '4px',
                    borderLeft: '2px solid #FFD700',
                    background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%)'
                  }}
                  title="TAP TO EXPAND"
                >
                  <div style={{
                    whiteSpace: isExpanded ? 'pre-wrap' : 'nowrap',
                    overflow: isExpanded ? 'visible' : 'hidden',
                    textOverflow: isExpanded ? 'clip' : 'ellipsis',
                    wordBreak: isExpanded ? 'break-word' : 'normal'
                  }}>
{"> "}{replyToMessage}
                  </div>
                  {!isExpanded && replyToMessage && replyToMessage.length > 30 && (
                    <span style={{ color: '#FFD700', fontSize: '9px', opacity: 0.6 }}> [...]</span>
                  )}
                </div>
              )}
              
              {/* AI Response - gaming style */}
              <div style={{ marginTop: '6px' }}>
                <p 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleExpandToggle();
                  }}
                  style={{
                    color: 'rgba(255, 255, 255, 0.9)',
                    fontSize: '10px',
                    lineHeight: '1.3',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    WebkitTapHighlightColor: 'transparent',
                    fontFamily: 'monospace',
                    whiteSpace: isExpanded ? 'pre-wrap' : 'normal',
                    wordBreak: isExpanded ? 'break-word' : 'normal',
                    display: isExpanded ? 'block' : '-webkit-box',
                    WebkitLineClamp: isExpanded ? 'none' : 2,
                    WebkitBoxOrient: isExpanded ? 'horizontal' : 'vertical'
                  }}
                  title="TAP TO EXPAND"
                >
                  {text}
                </p>
                {!isExpanded && text.length > 80 && (
                  <span style={{ color: '#FFD700', fontSize: '9px', opacity: 0.6 }}>[TAP FOR MORE]</span>
                )}
              </div>
              
              {/* Persist indicator - gaming style */}
              {isPersisted && (
                <div style={{
                  marginTop: '4px',
                  color: '#FFD700',
                  fontSize: '9px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  [PINNED]
                </div>
              )}
            </div>
          ) : (
            // Desktop: gaming style large layout
            <div style={{
              background: 'rgba(0, 0, 0, 0.9)',
              border: '3px solid #FFD700',
              borderRadius: '0px',
              boxShadow: '0 0 20px rgba(255, 215, 0, 0.4), inset 0 0 15px rgba(0, 0, 0, 0.8)',
              fontFamily: 'monospace'
            }}>
              {/* Gaming Agent Header */}
              <div style={{
                padding: '12px 16px',
                borderBottom: '2px solid #FFD700',
                background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.2) 0%, transparent 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '0px',
                    background: 'rgba(0, 0, 0, 0.8)',
                    border: '2px solid #FFD700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <span style={{
                      color: '#FFD700',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      textShadow: '0 0 4px rgba(255, 215, 0, 0.6)'
                    }}>
                      {AGENT_MAP[agentId]?.name?.[0] || 'A'}
                    </span>
                  </div>
                  <div>
                    <h3 style={{
                      fontWeight: 'bold',
                      color: '#FFD700',
                      fontSize: '14px',
                      textTransform: 'uppercase',
                      letterSpacing: '1px',
                      textShadow: '0 0 4px rgba(255, 215, 0, 0.6)',
                      margin: 0
                    }}>
                      AI AGENT: {AGENT_MAP[agentId]?.name || 'BOR'}
                    </h3>
                  </div>
                  {/* Desktop controls */}
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handlePersistToggle}
                      style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '2px solid #FFD700',
                        borderRadius: '0px',
                        padding: '4px 8px',
                        color: '#FFD700',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      {isPersisted ? 'UNPIN' : 'PIN'}
                    </button>
                    <button
                      onClick={handleHide}
                      style={{
                        background: 'rgba(0, 0, 0, 0.8)',
                        border: '2px solid #FFD700',
                        borderRadius: '0px',
                        padding: '4px 8px',
                        color: '#FFD700',
                        fontSize: '10px',
                        cursor: 'pointer',
                        fontFamily: 'monospace',
                        fontWeight: 'bold',
                        textTransform: 'uppercase'
                      }}
                    >
                      CLOSE
                    </button>
                  </div>
                </div>
              </div>

              {/* Reply Context - gaming style */}
              {replyTo && (
                <div style={{
                  padding: '8px 16px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  borderBottom: '1px solid #FFD700'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <img 
                      src={replyToPfp} 
                      alt={replyToHandle} 
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '0px',
                        border: '1px solid #FFD700'
                      }}
                    />
                    <span style={{
                      fontSize: '11px',
                      color: '#FFD700',
                      fontFamily: 'monospace',
                      fontWeight: 'bold',
                      textTransform: 'uppercase'
                    }}>
                      REPLY TO: {replyToHandle}
                    </span>
                  </div>
                  {replyToMessage && (
                    <p style={{
                      marginTop: '4px',
                      fontSize: '11px',
                      color: 'rgba(255, 255, 255, 0.8)',
                      fontFamily: 'monospace',
                      fontStyle: 'italic',
                      padding: '4px',
                      borderLeft: '2px solid #FFD700',
                      background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 50%)'
                    }}>
  {"> "}{replyToMessage}
                    </p>
                  )}
                </div>
              )}

              {/* Main Content - gaming style */}
              <div style={{ padding: '16px' }}>
                <p style={{
                  color: 'rgba(255, 255, 255, 0.9)',
                  lineHeight: '1.5',
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  margin: 0
                }}>
                  {text}
                </p>
              </div>

              {/* Persist indicator */}
              {isPersisted && (
                <div style={{
                  padding: '8px',
                  borderTop: '1px solid #FFD700',
                  background: 'linear-gradient(90deg, rgba(255, 215, 0, 0.1) 0%, transparent 100%)',
                  color: '#FFD700',
                  fontSize: '10px',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  [RESPONSE PINNED]
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}