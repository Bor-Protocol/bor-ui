import React, { Suspense, useRef, useState, useEffect, lazy, memo } from 'react';


import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Lazy load ThreeScene to reduce initial bundle size
const ThreeScene = lazy(() => import('./3d/ThreeScene'));
import { useScene } from '../contexts/ScenesContext';
import { LiveChat } from './old/LiveChat';
import AIResponseDisplay from './old/AIResponseDisplay';
import { useChatVisibility } from '../contexts/ChatVisibilityContext';

import { useSceneEngine } from '../contexts/SceneEngineContext';

interface Creator {
    name: string;
    avatar: string;
    description: string;
}

interface Scene {
    id: string;
    creator: Creator;
    backgroundColor?: string;
}

interface SceneWrapperProps {
    scene: Scene;
    index: number;
    debugMode?: boolean;
}

interface OrbitingBallProps {
    color: string;
    delay: boolean;
}

export const OrbitingBall = memo(function OrbitingBall({ color, delay }: OrbitingBallProps) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 ${delay ? 'animate-orbit-delayed' : 'animate-orbit'
                }`}
        >
            <div className={`w-3 h-3 ${color} rounded-full shadow-lg`} />
        </div>
    );
});

export const OrbitingBall2 = memo(function OrbitingBall2({ color: _color, delay }: OrbitingBallProps) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 ${delay ? 'animate-orbit-delayed' : 'animate-orbit'
                }`}
        >
            {/* <div className={`w-3 h-3 ${color} rounded-full shadow-lg`} /> */}
            <img src={`/bow2.svg`} alt="Orbiting Ball" className="w-6 h-6" />
        </div>
    );
});

export const SceneLoader = memo(function SceneLoader() {
    return (
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-24 h-24">
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    {/* <Music4 className="w-8 h-8 text-white animate-pulse" /> */}
                </div>
                <div className="absolute inset-0 origin-center">
                    <OrbitingBall color="bg-[#FFFFFF]" delay={false} />
                    <OrbitingBall color="bg-[#FFFFFF]" delay={true} />
                </div>
            </div>
        </div>
    );
});




const SceneContent = memo(function SceneContent({ scene, isActive, debugMode, orbitEnabled }: {
    scene: any,
    isActive: boolean,
    debugMode: boolean,
    orbitEnabled: boolean
}) {
    const { scenes, activeScene, sceneConfigIndex } = useScene();
    const { playBackgroundMusic, stopBackgroundMusic } = useSceneEngine();
    const currentScene = scenes[activeScene];
    const prevSceneRef = useRef<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [currentTrackIndex, ] = useState(0);

    useEffect(() => {
        let currentBgm = currentScene.bgm;
        
        // Stop any playing BGM
        stopBackgroundMusic();
        
        // Handle BGM playlist
        if (Array.isArray(currentBgm)) {
            // Play initial track
            playBackgroundMusic(currentBgm[currentTrackIndex]);
        } else if (currentBgm) {
            // Single track behavior
            playBackgroundMusic(currentBgm);
        }

        return () => {
            stopBackgroundMusic();
        };
    }, [activeScene, sceneConfigIndex]);

    useEffect(() => {
        if (prevSceneRef.current !== String(currentScene.id)) {
            setIsLoading(true);

            // Cleanup previous scene
            if (prevSceneRef.current) {
                // Signal ThreeScene to cleanup
                window.dispatchEvent(new CustomEvent('cleanup-scene', {
                    detail: { sceneId: prevSceneRef.current }
                }));
            }

            // Load new scene after a short delay to ensure cleanup
            const loadTimer = setTimeout(() => {
                prevSceneRef.current = String(currentScene.id);
                setIsLoading(false);
            }, 300);

            return () => clearTimeout(loadTimer);
        }
    }, [currentScene.id]);

    if (!isActive) return null;

    return (
        <Suspense fallback={<SceneLoader />}>
            {isLoading ? (
                <SceneLoader />
            ) : (
                <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                    {/* Animated heaven background */}
                    <iframe
                        src="/heaven-scene.html"
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            border: 'none',
                            zIndex: 1,
                            pointerEvents: 'none'
                        }}
                        title="Heaven Scene Background"
                    />
                    {/* 3D Canvas on top */}
                    <Canvas style={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%', 
                        zIndex: 2,
                        background: 'transparent',
                        pointerEvents: 'none' // Allow clicks to pass through to chat elements
                    }}>
                        <ThreeScene key={currentScene.id} debugMode={true} forceMaterialConversion={false} />
                        {false && <OrbitControls />}
                    </Canvas>
                </div>
            )}
        </Suspense>
    );
});

const SceneWrapper: React.FC<SceneWrapperProps> = ({
    scene,
    index
}) => {
    const {activeScene} = useScene();
    const { isMobile } = useChatVisibility();
    
    return (
        <div className="h-full w-full snap-start snap-always flex flex-col">
            <div className="flex-1 relative">
                {/* 3D Scene - Full screen */}
                <div className="absolute inset-0">
                    <SceneContent scene={scene} isActive={activeScene === index} debugMode={false} orbitEnabled={false} />
                </div>
                

                {/* Chat messages - positioned better for mobile */}
                <div className={isMobile 
                    ? "absolute bottom-32 left-2 right-2 max-w-sm" // Mobile: higher to avoid ChatSection collision
                    : "absolute left-2 w-80" // Desktop: positioned above ChatSection
                } style={{ 
                    zIndex: 10001,
                    bottom: isMobile ? undefined : 'calc(12rem - 50px)' // bottom-48 (12rem) minus 50px
                }}>
                    <LiveChat />
                </div>
                
                {/* AI Response - positioned better for mobile */}
                <div className={isMobile 
                    ? "absolute top-4 right-2" // Mobile: top-right corner
                    : ""
                } style={{ zIndex: 10002 }}>
                    <AIResponseDisplay />
                </div>
            </div>
        </div>
    );
};

export default memo(SceneWrapper);
