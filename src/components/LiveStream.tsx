import { ChatSection } from './ChatSection';
import { useState, useRef, useEffect } from 'react';
import { useScene } from '../contexts/ScenesContext';
import SceneWrapper from './SceneWrapper';
import { useParams } from 'react-router-dom';

export function LiveStream() {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);//
  const {
    setCurrentSceneIndex,
    setActiveScene,
    newScenes: scenes
  } = useScene();
  const containerRef = useRef<HTMLDivElement>(null);

  const { modelName } = useParams<{ modelName: string }>();


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





  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    setIsChatOpen(false);
  };


  return (
    <div className="flex flex-1 h-full w-full">
      {/* Main content area */}
      <div className="flex-1 flex-col min-w-0">

        <div
          ref={containerRef}
          className={`
            h-full w-full overflow-auto snap-y snap-mandatory
            ${isFullscreen ? 'fixed inset-0 z-[60] bg-black' : ''}
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
                    followers: 0
                  }
                }}
                isFullscreen={isFullscreen}
                toggleFullscreen={toggleFullscreen}
                index={index}
                toggleChat={() => setIsChatOpen(!isChatOpen)}
              />
            </div>
          ))}
        </div>

      
      </div>

      {/* Chat section */}
      {isFullscreen && (
        <div
          className={`
            ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} 
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
          <ChatSection onClose={() => setIsChatOpen(false)} />
        </div>
      )}

    </div>
  );
}