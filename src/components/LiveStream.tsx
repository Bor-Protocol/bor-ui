import { ChatSection } from './ChatSection';
import { useRef } from 'react';
import { useScene } from '../contexts/ScenesContext';
import SceneWrapper from './SceneWrapper';
import { useChatVisibility } from '../contexts/ChatVisibilityContext';
//import { useParams } from 'react-router-dom';

export function LiveStream() {
  const { isChatInputVisible, setIsChatInputVisible, isMobile } = useChatVisibility();
  
  const {
   // setCurrentSceneIndex,
   // setActiveScene,
    newScenes: scenes
  } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);

  const handleToggleChat = () => {
    setIsChatInputVisible(!isChatInputVisible);
  };

  return (
    <div className="flex flex-1 h-full w-full">
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
          {scenes.map((scene, index) => (
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
                index={index}
              />
            </div>
          ))}
        </div>

      
      </div>

      {/* Chat section is related to twitch and twitter received messages*/}
      <div style={{
        position: 'fixed',
        left: isMobile ? '0' : '10px',
        bottom: isMobile ? '0' : '10px', // Position at bottom on desktop
        right: isMobile ? '0' : 'auto',
        width: isMobile ? '100%' : '320px',
        maxWidth: isMobile ? '100vw' : '320px',
        zIndex: 10000, // Above the background layers
        // Add safe area support for mobile devices with notches
        paddingBottom: isMobile ? 'env(safe-area-inset-bottom)' : '0'
      }}>
        <ChatSection 
          isVisible={isChatInputVisible}
          onToggle={handleToggleChat}
        />
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

