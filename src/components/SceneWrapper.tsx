import React, { Suspense, useRef, useState, useEffect } from 'react';


import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ThreeScene from './3d/ThreeScene';
import { useScene } from '../contexts/ScenesContext';
import { LiveChat } from './old/LiveChat';
import AIResponseDisplay from './old/AIResponseDisplay';

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

export function OrbitingBall({ color, delay }: OrbitingBallProps) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 ${delay ? 'animate-orbit-delayed' : 'animate-orbit'
                }`}
        >
            <div className={`w-3 h-3 ${color} rounded-full shadow-lg`} />
        </div>
    );
}

export function OrbitingBall2({ color: _color, delay }: OrbitingBallProps) {
    return (
        <div
            className={`absolute left-1/2 top-1/2 -ml-1.5 -mt-1.5 ${delay ? 'animate-orbit-delayed' : 'animate-orbit'
                }`}
        >
            {/* <div className={`w-3 h-3 ${color} rounded-full shadow-lg`} /> */}
            <img src={`/bow2.svg`} alt="Orbiting Ball" className="w-6 h-6" />
        </div>
    );
}

export function SceneLoader() {
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
}




function SceneContent({ scene, isActive, }: {
    scene: any,
    isActive: boolean,
    debugMode: boolean,
    orbitEnabled: boolean
}) {
    const { scenes, activeScene, sceneConfigIndex } = useScene();
    const { playBackgroundMusic, stopBackgroundMusic } = useSceneEngine();
    const currentScene = scene; // Use the passed scene prop instead of looking it up
    const prevSceneRef = useRef<string | null>(null);
    const [currentTrackIndex, ] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);

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
            // Only cleanup if this is a real scene change (not initial load)
            if (prevSceneRef.current && isInitialized) {
                // Signal ThreeScene to cleanup
                window.dispatchEvent(new CustomEvent('cleanup-scene', {
                    detail: { sceneId: prevSceneRef.current }
                }));
            }

            // Update to new scene
            prevSceneRef.current = String(currentScene.id);
            setIsInitialized(true);
        }
    }, [currentScene.id, isInitialized]);

    // Don't return null for inactive scenes - we need them rendered for smooth scrolling
    // if (!isActive) return null;

    if (!isActive) {
        // For inactive scenes, show a placeholder to maintain scroll positioning
        return (
            <div className="w-full h-full bg-gray-900 flex items-center justify-center">
                <div className="text-white text-lg">{currentScene.title}</div>
            </div>
        );
    }

    return (
        <Suspense fallback={<SceneLoader />}>
            <Canvas
                frameloop="always"
                dpr={[1, 2]}
                performance={{ min: 0.5 }}
                gl={{ 
                    antialias: true,
                    alpha: false,
                    powerPreference: "high-performance",
                    preserveDrawingBuffer: true
                }}
            >
                <ThreeScene 
                    key={`threescene-${currentScene.id}-${currentScene.agentId}-${currentScene.title}`} 
                    debugMode={false} 
                    sceneOverride={currentScene} 
                />
                {false && <OrbitControls />}
            </Canvas>
        </Suspense>
    );
}

const SceneWrapper: React.FC<SceneWrapperProps> = ({
    scene,
    index
}) => {
    const {activeScene} = useScene();
    
    return (
        <div className="h-full w-full snap-start snap-always flex flex-col">
            <div className="flex-1 relative">
                {/* 3D Scene - Always render */}
                <div className="absolute inset-0">
                    <SceneContent scene={scene} isActive={activeScene === index} debugMode={false} orbitEnabled={false} />
                </div>
                        <LiveChat />
                        <AIResponseDisplay />
            </div>
        </div>
    );
};

export default SceneWrapper;
