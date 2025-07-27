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
    <div className="flex flex-1 h-full w-full">
      {/* Session Timer and Home Button */}
      <SessionTimer />
      
      {/* Preview Mode Banner */}
      {isPreview && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[90] bg-gradient-to-r from-orange-500/90 to-red-500/90 backdrop-blur-sm text-white px-6 py-3 rounded-full border border-white/20 shadow-lg">
          <div className="flex items-center gap-2 text-sm font-medium">
            <span>👁️</span>
            <span>Preview Mode</span>
            <span className="text-orange-200">•</span>
            <span className="text-orange-200">Sign up to book private sessions</span>
          </div>
        </div>
      )}
      
      {/* Main content area */}
      <div className="flex-1 flex-col min-w-0">

        <div
          ref={containerRef}
          className={`
            h-full w-full overflow-auto snap-y snap-mandatory
           fixed inset-0 z-[60] bg-black
          `}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
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
          <div className="fixed bottom-4 left-4 right-4 z-[70] md:right-[340px]">
            <div className="max-w-2xl mx-auto">
              {isPreview ? (
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm rounded-lg p-4 border border-orange-500/30">
                  <div className="text-center text-white">
                    <p className="text-sm font-medium mb-2">👁️ Preview Mode - Limited Access</p>
                    <p className="text-xs text-orange-200 mb-3">
                      Sign up to send messages and book private sessions
                    </p>
                    <button 
                      onClick={() => window.location.href = '/'}
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg text-sm font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200"
                    >
                      Sign Up Now
                    </button>
                  </div>
                </div>
              ) : (
                <MessageInput 
                  placeholder={`Send a message to ${displayScenes[0]?.creator?.username || modelName}...`}
                  className="bg-black/80 backdrop-blur-sm rounded-lg p-4 border border-gray-600"
                />
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
            md:border-l md:border-gray-100 md:dark:border-gray-700
          `}
        >
          <ChatSection />
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

