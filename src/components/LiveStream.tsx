import { ChatSection } from './ChatSection';
import { useRef, useEffect } from 'react';
import { useScene } from '../contexts/ScenesContext';
import SceneWrapper from './SceneWrapper';
import { useParams, useSearchParams } from 'react-router-dom';
import { getStreamConfigByIdentifier } from '../utils/constants';
import { MessageInput } from './MessageInput';
import { SessionTimer } from './SessionTimer';

export function LiveStream() {
  const { modelName } = useParams<{ modelName?: string }>();
  const [searchParams] = useSearchParams();
  const isPreview = searchParams.get('preview') === 'true';
  
  const {
    setCurrentSceneIndex,
    setActiveScene,
    newScenes: scenes,
    currentAgentId
  } = useScene();
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Animated Bubbles Component
  const AnimatedBubbles = () => {
    const bubbles = Array.from({ length: 8 }, (_, i) => ({
      id: i,
      size: Math.random() * 60 + 20,
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: Math.random() * 8 + 8
    }));

    return (
      <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden">
        {bubbles.map((bubble) => (
          <div
            key={bubble.id}
            className="absolute rounded-full opacity-10"
            style={{
              width: `${bubble.size}px`,
              height: `${bubble.size}px`,
              left: `${bubble.left}%`,
              background: `linear-gradient(135deg, 
                rgba(147, 51, 234, 0.3) 0%, 
                rgba(59, 130, 246, 0.3) 50%, 
                rgba(16, 185, 129, 0.3) 100%)`,
              animation: `floatUp ${bubble.duration}s ease-in-out infinite`,
              animationDelay: `${bubble.delay}s`
            }}
          />
        ))}
        <style jsx>{`
          @keyframes floatUp {
            0% {
              transform: translateY(100vh) scale(0);
              opacity: 0;
            }
            10% {
              opacity: 0.1;
            }
            90% {
              opacity: 0.1;
            }
            100% {
              transform: translateY(-100px) scale(1);
              opacity: 0;
            }
          }
        `}</style>
      </div>
    );
  };

  // Filter scenes based on URL parameter
  const displayScenes = modelName 
    ? scenes.filter(scene => scene.identifier === modelName)
    : scenes;

  // When modelName changes, update the current scene
  useEffect(() => {
    if (modelName) {
      const targetScene = scenes.find(scene => scene.identifier === modelName);
      if (targetScene) {
        const sceneIndex = scenes.findIndex(scene => scene.identifier === modelName);
        if (sceneIndex !== -1) {
          setCurrentSceneIndex(sceneIndex);
          setActiveScene(sceneIndex);
        }
      }
    } else {
      // If no modelName, default to first scene (for /app route)
      if (scenes.length > 0) {
        setCurrentSceneIndex(0);
        setActiveScene(0);
      }
    }
  }, [modelName, scenes, setCurrentSceneIndex, setActiveScene]);

  // Handle scroll observation for multiple scenes
  useEffect(() => {
    // Only set up scroll observer when showing all scenes (no specific modelName)
    if (modelName) return;
    
    const container = containerRef.current;
    if (!container) return;

    let timeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = Number(entry.target.getAttribute('data-index'));
            if (!isNaN(index)) {
              if (timeout) clearTimeout(timeout);
              
              timeout = setTimeout(() => {
                const actualSceneIndex = scenes.findIndex(s => s.id === displayScenes[index].id);
                setCurrentSceneIndex(actualSceneIndex);
                setActiveScene(actualSceneIndex);
                console.log('Scrolled to scene:', {
                  displayIndex: index,
                  actualIndex: actualSceneIndex,
                  sceneName: displayScenes[index].modelName
                });
              }, 50);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
        rootMargin: '-10% 0px',
      }
    );

    const sceneElements = container.querySelectorAll('[data-index]');
    sceneElements.forEach((scene) => observer.observe(scene));

    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [modelName, displayScenes, scenes, setCurrentSceneIndex, setActiveScene]);

  return (
    <div className="flex flex-1 h-full w-full bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
      {/* Session Timer and Home Button */}
      <SessionTimer />
      
      {/* Animated Bubbles */}
      <AnimatedBubbles />

      {/* Preview Mode Banner */}
      {isPreview && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[90] rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md animate-slideUpAndScale">
          <div className="bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl p-1">
            <div className="bg-slate-900/90 rounded-2xl px-6 py-4">
              <div className="flex items-center gap-3 text-sm font-medium text-white">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  <span className="bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent font-semibold">
                    👁️ Preview Mode
                  </span>
                </div>
                <span className="text-slate-400">•</span>
                <span className="text-slate-300">Sign up to book private sessions</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex-col min-w-0">

        <div
          ref={containerRef}
          className={`
            h-full w-full overflow-auto snap-y snap-mandatory
           fixed inset-0 z-[60] bg-slate-900
          `}
          style={{ 
            scrollbarWidth: 'none', 
            msOverflowStyle: 'none',
            backgroundColor: '#0f172a'
          }}
        >
          {displayScenes.map((scene, index) => (
            <div
              key={scene.id || `scene-${index}`}
              data-index={index}
              data-scene-index={index}
              className="h-full w-full snap-start snap-always flex flex-col"
            >
              <SceneWrapper
                scene={{
                  ...scene,
                  id: scene.id.toString(),
                  creator: {
                    ...scene.creator,
                    name: scene.creator.title,
                    description: scene.creator.title,
                  }
                }}
                index={scenes.findIndex(s => s.id === scene.id)}
              />
            </div>
          ))}
        </div>

        {/* Message Input for individual agent streams */}
        {modelName && (
          <div className="fixed bottom-4 right-4 z-[70] w-80">
            <div className="w-full">
              {isPreview ? (
                <div className="rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md animate-slideUpAndScale">
                  <div className="bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 rounded-2xl p-1">
                    <div className="bg-slate-900/95 rounded-2xl p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-3">
                        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                        <span className="text-sm font-semibold bg-gradient-to-r from-orange-400 to-pink-400 bg-clip-text text-transparent">
                          👁️ Preview Mode - Limited Access
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mb-4">
                        Sign up to send messages and book private sessions
                      </p>
                      <button 
                        onClick={() => window.location.href = '/'}
                        className="group relative overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-sm font-semibold hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-2xl"
                      >
                        <span className="relative z-10">🚀 Sign Up Now</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md">
                  <div className="bg-gradient-to-r from-slate-800/50 via-slate-700/50 to-slate-800/50 rounded-2xl p-1">
                    <div className="bg-slate-900/95 rounded-2xl">
                      <MessageInput 
                        placeholder={`💬 Send a message to ${displayScenes[0]?.creator?.username || modelName}...`}
                        className="bg-transparent rounded-2xl p-4 border-none text-white placeholder-slate-400"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      
      </div>

      {/* Chat section is related to twitch and twitter received messages*/}
     
        <div
          className={`
           translate-x-0
            fixed md:relative md:translate-x-0 
            right-0 top-16 bottom-0 
            w-full md:w-[320px] md:min-w-[320px]
            z-40 
            transition-transform duration-300 ease-in-out 
            md:top-0
            md:h-full
            md:border-l md:border-white/10
          `}
          style={{ backgroundColor: '#0f172a' }}
        >
          <div className="h-full bg-gradient-to-b from-slate-900/50 to-slate-800/50 backdrop-blur-sm border-l border-white/10">
            <ChatSection />
          </div>
        </div>
    </div>
  );
}




//just kept to be used for future reference

  //const { modelName } = useParams<{ modelName: string }>();

  /* to be removed related to model name from URL

  // Handle model name from URL
  useEffect(() => {
    if (modelName) {
      const sceneIndex = scenes.findIndex(scene => scene.modelName?.toLowerCase() === modelName.toLowerCase());
      if (sceneIndex !== -1) {
        setCurrentSceneIndex(sceneIndex);
        setActiveScene(sceneIndex);
        const sceneElement = document.querySelector(`[data-scene-index="${sceneIndex}"]`);
        sceneElement?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [modelName, scenes, setCurrentSceneIndex, setActiveScene]);
    */
  /* to be removed related to scroll down multiple scenes
  // Scroll down multiple scenes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let timeout: NodeJS.Timeout;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute('data-index'));
          if (!isNaN(index)) {
            if (entry.isIntersecting) {
              if (timeout) clearTimeout(timeout);


              setCurrentSceneIndex(index);
              timeout = setTimeout(() => {
                setActiveScene(index);
                console.log('Scrolled to scene:', {
                  index,
                  sceneId: scenes[index].id,
                  sceneType: scenes[index].type
                });
              }, 50);
            }
          }
        });
      },
      {
        root: container,
        threshold: 0.6,
        rootMargin: '-10% 0px',
      }
    );

    const sceneElements = container.querySelectorAll('[data-index]');
    sceneElements.forEach((scene) => observer.observe(scene));

    return () => {
      observer.disconnect();
      if (timeout) clearTimeout(timeout);
    };
  }, [setCurrentSceneIndex, setActiveScene, scenes]);


*/

