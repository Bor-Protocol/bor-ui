import React, { Suspense, useRef, useState, useEffect } from 'react';


import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import ThreeScene from './3d/ThreeScene';
import { useScene } from '../contexts/ScenesContext';
import { HeartAnimation } from './old/HeartAnimation';
import { LiveChat } from './old/LiveChat';
import AIResponseDisplay from './old/AIResponseDisplay';

import { useSocket } from '../hooks/useSocket';
import { useSceneEngine } from '../contexts/SceneEngineContext';

interface Creator {
    name: string;
    avatar: string;
    description: string;
    followers: number;
}

interface Scene {
    id: string;
    creator: Creator;
    backgroundColor?: string;
}

interface SceneWrapperProps {
    scene: Scene;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    index: number;
    toggleChat: () => void;
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

export function OrbitingBall2({ color, delay }: OrbitingBallProps) {
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

function SceneErrorFallback() {
    return (
        <div className="absolute inset-0 flex items-center justify-center bg-red-300">
            <div className="text-center p-4">
                <h3 className="text-lg font-semibold mb-2">Something went wrong</h3>
                <p className="text-muted-foreground">Please try refreshing the page</p>
            </div>
        </div>
    );
}


function SceneContent({ scene, isActive, debugMode, orbitEnabled }: {
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
    const [currentTrackIndex, setCurrentTrackIndex] = useState(0);

    useEffect(() => {
        const sceneConfig = currentScene.sceneConfigs[sceneConfigIndex];
        let currentBgm = sceneConfig?.bgm || currentScene.bgm;
        
        // Stop any playing BGM
        stopBackgroundMusic();
        
        // Handle BGM playlist
        if (Array.isArray(currentBgm)) {
            const playNextTrack = () => {
                setCurrentTrackIndex(prevIndex => {
                    const nextIndex = (prevIndex + 1) % currentBgm.length;
                    playBackgroundMusic(currentBgm[nextIndex]);
                    return nextIndex;
                });
            };

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
        if (prevSceneRef.current !== currentScene.id) {
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
                prevSceneRef.current = currentScene.id;
                setIsLoading(false);
            }, 300);

            return () => clearTimeout(loadTimer);
        }
    }, [currentScene.id]);

    // Add keyboard controls for debug mode
    // useEffect(() => {
    // //     if (!debugMode) return;

    // //     // const handleKeyDown = (e: KeyboardEvent) => {
    // //     //     // Dispatch custom event for ThreeScene to handle
    // //     //     window.dispatchEvent(new CustomEvent('debug-control', {
    // //     //         detail: { 
    // //     //             key: e.key,
    // //     //             shift: e.shiftKey,
    // //     //             ctrl: e.ctrlKey
    // //     //         }
    // //     //     }));
    // //     // };

    // //     // window.addEventListener('keydown', handleKeyDown);
    // //     return () => window.removeEventListener('keydown', handleKeyDown);
    // // }, [debugMode]);

    if (!isActive) return null;

    return (
        <Suspense fallback={<SceneLoader />}>
            {isLoading ? (
                <SceneLoader />
            ) : (
                <Canvas>
                    <ThreeScene key={currentScene.id} debugMode={false} orbitEnabled={orbitEnabled} />
                    {orbitEnabled && <OrbitControls />}
                </Canvas>
            )}
        </Suspense>
    );
}

const SceneWrapper: React.FC<SceneWrapperProps> = ({
    scene,
    isFullscreen,
    toggleFullscreen,
    index,
    toggleChat,
    debugMode: initialDebugMode = false
}) => {
    const [debugMode, setDebugmode] = useState(initialDebugMode);
    const [orbitEnabled, setOrbitEnabled] = useState(false);

    const {
       
        lastLikeTimestamp,
       
        activeScene,
       
    } = useScene();
    const { peerCount } = useSocket();
   
    const [isHeartAnimating, setIsHeartAnimating] = useState(false);

   

    


    // Update the viewport height effect to run immediately
    useEffect(() => {
        const updateHeight = () => {
            const vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', `${vh}px`);
        };

        // Run immediately
        updateHeight();

        // Force a second update after a brief delay to handle any initial rendering issues
        const initialTimeout = setTimeout(updateHeight, 100);

        // Add resize listener
        window.addEventListener('resize', updateHeight);

        return () => {
            window.removeEventListener('resize', updateHeight);
            clearTimeout(initialTimeout);
        };
    }, []);
    useEffect(() => {
        // Force fullscreen on mount
        if (!isFullscreen) {
            toggleFullscreen();
        }
    }, []);

    // Heart animation
    useEffect(() => {
        if (lastLikeTimestamp) {
            setIsHeartAnimating(true);
            const timer = setTimeout(() => setIsHeartAnimating(false), 100);
            return () => clearTimeout(timer);
        }
    }, [lastLikeTimestamp]);


    

   // Empty dependency array means this runs once on mount

    return (
        <div className="h-full w-full snap-start snap-always flex flex-col">
            <div className="flex-1 relative">
                {/* 3D Scene - Always render */}
                <div className="absolute inset-0">
                    <SceneContent scene={scene} isActive={activeScene === index} debugMode={debugMode} orbitEnabled={orbitEnabled} />
                </div>

                        <HeartAnimation isLiked={isHeartAnimating} />

                        <LiveChat />

                        <AIResponseDisplay />


            </div>
        </div>
    );
};

export default SceneWrapper;
