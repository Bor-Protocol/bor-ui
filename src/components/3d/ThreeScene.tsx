import { useEffect, useRef, useCallback, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { PerspectiveCamera, Environment, useGLTF } from '@react-three/drei';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import {
  AnimationMixer,
  Clock,
  Group,
  AnimationAction,
  LoopOnce,
  LoopRepeat
} from 'three';
import { loadMixamoAnimation } from '../old/loadMixamoAnimation';
import { useScene } from '../../contexts/ScenesContext.js';
// import Note from '../Note';

import { getAnimationUrl, getEnvironmentUrl, getModelUrl } from '../../utils/constants.js';
import { useSceneEngine } from '../../contexts/SceneEngineContext.js';
import { SceneConfig } from '../../utils/constants.js';

// Configuration for different models
// interface ModelConfig {
//   cameraPosition: [number, number, number];
//   modelPosition: [number, number, number];
//   modelRotation: [number, number, number];
//   modelScale: [number, number, number];
//   environmentScale: [number, number, number];
//   environmentPosition: [number, number, number];
//   environmentRotation: [number, number, number];
// }

// const MODEL_CONFIG = {
//   cameraPosition: [0, 1.15, 1],
//   modelPosition: [0, 0, 0],
//   modelRotation: [0, 0, 0],
//   modelScale: [1, 1, 1],
//   environmentScale: [2, 1.9, 2],
//   environmentPosition: [0, -1, -5],
//   environmentRotation: [0, Math.PI / 2, 0],
// }

export const IPFS_BASE_URL = 'https://bafybeibgfj5zr3wtmbl6hgx5kuc4suiledti3ozkhydt2mitmkpq7iqbwm.ipfs.flk-ipfs.xyz/animations';
//avoir ca doit etre changer par le bon url cdn


// Remove unused ANIMATIONS array
 const ANIMATIONS = [
  '/animations/acknowledging.fbx',
  '/animations/angry_gesture.fbx',
  '/animations/annoyed_head_shake.fbx',
  '/animations/being_cocky.fbx',
  // '/animations/blow_a_kiss.fbx',
  '/animations/dismissing_gesture.fbx',
  // '/animations/happy_hand_gesture.fbx',
  '/animations/hard_head_nod.fbx',
  '/animations/head_nod_yes.fbx',
  '/animations/hip_hop_dancing.fbx',
  '/animations/idle.fbx',
  '/animations/laughing.fbx',
  '/animations/lengthy_head_nod.fbx',
  '/animations/look_away_gesture.fbx',
  '/animations/relieved_sigh.fbx',
  '/animations/sarcastic_head_nod.fbx',
  '/animations/shaking_head_no.fbx',
  '/animations/thoughtful_head_shake.fbx',
  '/animations/weight_shift.fbx',
  '/animations/defeated.fbx',
  '/animations/praying.fbx',
  '/animations/hiphop_dancing.fbx',
  '/animations/silly_dancing.fbx',
  '/animations/angry.fbx',
  '/animations/happy_idle.fbx',
  '/animations/floating.fbx',
  '/animations/robot_dance.fbx',
  '/animations/bboy_hipHopMove.fbx',
  '/animations/swing_dancing.fbx',
  '/animations/nervously_look_around.fbx',
  '/animations/arm_stretching.fbx',
  '/animations/salute.fbx',
  '/animations/excited.fbx',
  '/animations/greeting.fbx',
  '/animations/arguing.fbx',
  '/animations/chicken_dance.fbx',
  '/animations/youre_loser.fbx',
  '/animations/look_around.fbx',
  '/animations/saying_no.fbx',
  '/animations/shaking_hands.fbx',
  '/animations/insulting.fbx',
  '/animations/threatening.fbx',
  '/animations/happy.fbx',
  '/animations/are_you_crazy.fbx',
  '/animations/focusing.fbx',
  '/animations/speedbag_boxing.fbx',
  '/animations/idlet.fbx',
  '/animations/Pointing.fbx',
  '/animations/light_dance.fbx',
  '/animations/hands_up.fbx',
  '/animations/trump_dance.fbx',
  '/animations/Listening_To_Music.fbx',
  '/animations/play_golf.fbx',
  '/animations/cheering.fbx',
  '/animations/fist_up.fbx'


];




// Make CafeEnvironment a proper React component
const CafeEnvironment: React.FC<{ environmentUrl: string, config: SceneConfig }> = ({ environmentUrl: _environmentUrl, config }) => {
  // console.log("CAFE_ENVIRONMENT", _environmentUrl)
  const environmentUrl = getEnvironmentUrl(_environmentUrl)
  const { scene } = useGLTF(environmentUrl);

  if (!scene) {
    console.error('Cafe scene is missing');
    return null;
  }

  return (
    <primitive
      object={scene}
      scale={config.environmentScale}
      position={config.environmentPosition}
      rotation={config.environmentRotation}
    />
  );
};



export function ThreeScene({ debugMode, sceneOverride }: { debugMode: boolean; sceneOverride?: any }) {
  const modelRefs = useRef<(Group | undefined)[]>([]);
  const vrmRefs = useRef<any[]>([]);
  const mixerRefs = useRef<(AnimationMixer | undefined)[]>([]); 
  const actionsRefs = useRef<{ [key: string]: AnimationAction }[]>([]);

  const clockRef = useRef(new Clock());
  const currentActionRef = useRef<string | null>(null);
  const nextAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { animation, animationFile, audioData } = useSceneEngine();
  const { newScenes, activeScene, sceneConfigIndex } = useScene();
  
  // Use sceneOverride if provided, otherwise use global context
  const scene = sceneOverride || newScenes[activeScene];
  
  // CRITICAL: Use different config index logic based on whether we have an override
  const activeSceneConfig = useMemo(() => {
    if (!scene?.sceneConfigs?.length) return null;
    
    // When sceneOverride is provided, always use the first config (index 0)
    // When no override, use the global sceneConfigIndex
    const configIndex = sceneOverride ? 0 : sceneConfigIndex;
    const config = scene.sceneConfigs[configIndex];
    
    
    return config;
  }, [scene, sceneConfigIndex, sceneOverride]);
  
  // This is the config we use for the scene
  const [sceneConfig, setSceneConfig] = useState<SceneConfig | null>(null);
  
  // Use activeSceneConfig as fallback if sceneConfig is not set yet
  const currentConfig = sceneConfig || activeSceneConfig;
  
  const environmentUrl = currentConfig?.environmentURL;
  const models = currentConfig?.models || [];


  // This is the index of the model we are currently using (editor)

  // Add camera position state with default values
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>([2.86, 0.76, -7.73]);
  const [cameraRotation, setCameraRotation] = useState<number>(-4.708758241001718);
  const [cameraPitch, setCameraPitch] = useState<number>(0);

  console.log("THIS IS THE SCENE CONFIG", { ...sceneConfig, cameraPosition, cameraRotation, cameraPitch })



  // Function to play a specific animation
  const playAnimation = useCallback((animationPath: string, loopOnce: boolean = true, modelIndex: number = 0) => {
    console.log('🎬 Playing Animation:', { 
      animationPath, 
      loopOnce, 
      modelIndex,
      hasMixer: !!mixerRefs.current[modelIndex],
      hasActions: !!actionsRefs.current[modelIndex]
    });

    const mixer = mixerRefs.current[modelIndex];
    const actions = actionsRefs.current[modelIndex];
    if (!mixer || !actions?.[animationPath]) return;

    // Cancel any pending animation timeouts
    if (nextAnimationTimeoutRef.current) {
      clearTimeout(nextAnimationTimeoutRef.current);
    }

    // Fade out current animation if it exists
    if (currentActionRef.current && actions[currentActionRef.current]) {
      const currentAction = actions[currentActionRef.current];
      currentAction.fadeOut(0.5);
    }

    // Play new animation
    const action = actions[animationPath];
    action.reset();
    action.clampWhenFinished = loopOnce;
    action.loop = loopOnce ? LoopOnce : LoopRepeat;
    action.fadeIn(0.5);
    action.play();

    currentActionRef.current = animationPath;

    // If playing a one-shot animation, return to idle afterwards
    if (loopOnce) {
      const onFinished = () => {
        mixer.removeEventListener('finished', onFinished);
        nextAnimationTimeoutRef.current = setTimeout(() => {
          const defaultAnim = models[modelIndex].defaultAnimation || 'idle';
          playAnimation(getAnimationUrl(defaultAnim), false, modelIndex);
        }, 100);
      };

      mixer.addEventListener('finished', onFinished);
    }
  }, [models]);

  // Handle animation changes coming in from top level
  useEffect(() => {
    if (!animation || !animationFile) return;
    
    console.log('🎮 ThreeScene Animation Update:', { 
      animation,
      animationFile,
      models: models.map(m => ({ 
        agentId: m.agentId, 
        defaultAnimation: m.defaultAnimation ?? 'idle'
      }))
    });
    
    // Process animations for all agents
    Object.entries(animation).forEach(([agentId, currentAnimation]) => {
      // Find the model index for this agent
      const modelIndex = models.findIndex(model => model.agentId === agentId);
      
      console.log('🎯 Processing Agent:', { 
        agentId,
        modelIndex, 
        currentAnimation,
        hasVRM: !!vrmRefs.current[modelIndex],
      });

      if (modelIndex === -1) return;

      const vrm = vrmRefs.current[modelIndex];
      if (!vrm) return;

      if (currentAnimation && actionsRefs.current[modelIndex]?.[currentAnimation]) {
        console.log('▶️ Playing Existing Animation:', {
          agentId,
          animation: currentAnimation,
          modelIndex
        });
        playAnimation(currentAnimation, true, modelIndex);
      } else {
        console.log('🔄 Loading New Animation:', {
          agentId,
          animation: currentAnimation,
          modelIndex
        });
        currentAnimation && loadMixamoAnimation(getAnimationUrl(currentAnimation), vrm)
          .then(clip => {
            if (mixerRefs.current[modelIndex]) {
              console.log('✅ Animation Loaded Successfully:', {
                agentId,
                animation: currentAnimation,
                modelIndex
              });
              const action = mixerRefs.current[modelIndex]!.clipAction(clip);
              if (currentAnimation) {
                actionsRefs.current[modelIndex][currentAnimation] = action;
                playAnimation(currentAnimation, true, modelIndex);
              }
            }
          })
          .catch(error => {
            console.error('❌ Animation Load Error:', {
              agentId,
              animation: currentAnimation,
              modelIndex,
              error: error.message
            });
          });
      }
    });
  }, [animation, animationFile, models, playAnimation]);


  // Add a cleanup function to clear models
  const cleanupModels = useCallback(() => {
    // Clear all models
    modelRefs.current.forEach(model => {
      if (model) {
        model.clear();
      }
    });
    modelRefs.current = [];
    vrmRefs.current = [];
    mixerRefs.current = [];
    actionsRefs.current = [];
  }, []);

  // Add loading state
  const [, setModelsLoaded] = useState<boolean[]>([]);
  const [, setAllModelsLoaded] = useState(false);

  // Modify the model loading effect
  useEffect(() => {
    if (!currentConfig) return;

    // Initialize loading states
    setModelsLoaded(new Array(models.length).fill(false));
    setAllModelsLoaded(false);

    // Cleanup existing models when models array changes
    cleanupModels();

    // Initialize refs for new models
    models.forEach((_, index) => {
      modelRefs.current[index] = new Group();
    });

    // Update positions for new models
    models.forEach((modelConfig, index) => {
      if (modelRefs.current[index]) {
        modelRefs.current[index].position.set(...modelConfig.modelPosition);
        modelRefs.current[index].rotation.set(...modelConfig.modelRotation);
        modelRefs.current[index].scale.set(...modelConfig.modelScale);
      }
    });

    // Load new models
    const loader = new GLTFLoader();
    loader.register((parser) => {
      return new VRMLoaderPlugin(parser, {
        autoUpdateHumanBones: true
      });
    });

    // Load each model in parallel
    const loadPromises = models.map((modelConfig, index) => {
      const modelUrl = getModelUrl(modelConfig.model);
      
      return new Promise((resolve, reject) => {
        loader.load(
          modelUrl,
          async (gltf) => {
            const vrm = gltf.userData.vrm;
            vrmRefs.current[index] = vrm;

            vrm.scene.traverse((obj: any) => {
              obj.frustumCulled = false;
            });

            VRMUtils.rotateVRM0(vrm);

            // Initialize eyes to be OPEN (very important!)
            if (vrm.expressionManager) {
              vrm.expressionManager.setValue('blinkLeft', 0);
              vrm.expressionManager.setValue('blinkRight', 0);
              vrm.expressionManager.setValue('blink', 0);
              // Also reset mouth expressions
              vrm.expressionManager.setValue('aa', 0);
              vrm.expressionManager.setValue('ih', 0);
              vrm.expressionManager.setValue('ou', 0);
              console.log('👁️ Eyes initialized to OPEN state');
            }

            // Create a new Group if it doesn't exist
            if (!modelRefs.current[index]) {
              modelRefs.current[index] = new Group();
            }

            // Clear and add the new scene
            modelRefs.current[index].clear();
            modelRefs.current[index].add(vrm.scene);

            // Create animation mixer for this model
            const mixer = new AnimationMixer(vrm.scene);
            mixerRefs.current[index] = mixer;
            actionsRefs.current[index] = {};

            try {
              // Load default animation for this model
              const idleAnimation = getAnimationUrl(modelConfig.defaultAnimation || 'idle');
              const clip = await loadMixamoAnimation(idleAnimation, vrm);
              const action = mixer.clipAction(clip);
              actionsRefs.current[index][idleAnimation] = action;
              
              // Play the idle animation
              action.reset();
              action.loop = LoopRepeat;
              action.fadeIn(0.5);
              action.play();
            } catch (error) {
              console.error(`Error loading idle animation for model ${index}:`, error);
            }

            resolve(vrm);
          },
          undefined,
          reject
        );
      });
    });

    // Wait for all models to load
    Promise.all(loadPromises).catch(error => {
      console.error('Error loading models:', error);
    });

    return () => {
      cleanupModels();
    };
  }, [models, cleanupModels]); // Add models to dependency array to reload when they change

  // Update animation frame with optimized delta time
  useFrame((state, delta) => {
    // Clamp delta to prevent lag spikes from causing animation jumps
    const clampedDelta = Math.min(delta, 1/30); // Cap at 30fps minimum for smooth animations
    
    // Update mixers with clamped delta
    if (mixerRefs.current) {
      mixerRefs.current.forEach(mixer => {
        if (mixer) {
          mixer.update(clampedDelta);
        }
      });
    }

    if (vrmRefs.current) {
      const elapsedTime = clockRef.current.elapsedTime;

      // Lip sync logic
      vrmRefs.current.forEach((vrm, _index) => {
        if (!vrm || !vrm.expressionManager) return;

        if (audioData.isPlaying) {
          // Map audio amplitude to mouth movement
          const mouthOpen = Math.min(audioData.amplitude * 1.5, 1.0);
          
          // Apply smoothing
          const currentMouthOpen = vrm.expressionManager.getValue('aa') || 0;
          const smoothedMouthOpen = currentMouthOpen * 0.5 + mouthOpen * 0.5;

          // Update mouth expressions
          vrm.expressionManager.setValue('aa', smoothedMouthOpen);
          vrm.expressionManager.setValue('ih', smoothedMouthOpen * 0.5);
          vrm.expressionManager.setValue('ou', smoothedMouthOpen * 0.3);
        } else {
          // Reset mouth when not speaking
          vrm.expressionManager.setValue('aa', 0);
          vrm.expressionManager.setValue('ih', 0);
          vrm.expressionManager.setValue('ou', 0);
        }

        // Fixed blinking logic - eyes should be OPEN most of the time
        const blinkInterval = 4; // Blink every 4 seconds
        const blinkDuration = 0.15; // Quick blink duration
        const timeSinceLastInterval = elapsedTime % blinkInterval;

        let blinkValue = 0; // 0 = eyes open, 1 = eyes closed

        // Only blink for a short duration at the start of each interval
        if (timeSinceLastInterval < blinkDuration) {
          // Create a smooth blink curve (0 -> 1 -> 0)
          const progress = timeSinceLastInterval / blinkDuration;
          blinkValue = Math.sin(progress * Math.PI); // Smooth curve from 0 to 1 and back to 0
        }

        // Apply blinking
        vrm.expressionManager.setValue('blinkLeft', blinkValue);
        vrm.expressionManager.setValue('blinkRight', blinkValue);
        vrm.expressionManager.setValue('blink', blinkValue); // Some models use 'blink' instead

        vrm.update(clampedDelta);
      });
    }
  });


  console.log({vrmRefs})

  // Add this near your other refs
  const modelPositionsRef = useRef<[number, number, number][]>([]);

  // Initialize the positions ref when models change
  useEffect(() => {
    modelPositionsRef.current = models.map(model => [...model.modelPosition]);
  }, [models]);

  // Add this with your other refs
  const modelRotationsRef = useRef<[number, number, number][]>([]);

  // Initialize the rotations ref when models change
  useEffect(() => {
    modelRotationsRef.current = models.map(model => [...model.modelRotation]);
  }, [models]);

  // Add this helper function at the component level
  const logSceneConfig = () => {
    const currentConfig = {
      id: activeSceneConfig.id,
      name: activeSceneConfig.name,
      environmentURL: environmentUrl,
      models: models.map((model, index) => ({
        ...model,
        modelPosition: modelPositionsRef.current[index] || model.modelPosition,
        modelRotation: modelRotationsRef.current[index] || model.modelRotation,
        modelScale: modelRefs.current[index]?.scale.toArray() || model.modelScale,
      })),
      environmentScale: currentConfig.environmentScale,
      environmentPosition: currentConfig.environmentPosition,
      environmentRotation: currentConfig.environmentRotation,
      cameraPitch,
      cameraPosition,
      cameraRotation,
    };

    console.log("THIS IS THE CURRENT CONFIG", JSON.stringify(currentConfig, null, 2));
  };



  useEffect(() => {
    if (activeSceneConfig) {
      setSceneConfig(activeSceneConfig);
      // Update camera settings from the new config
      setCameraPosition(activeSceneConfig.cameraPosition || [2.86, 0.76, -7.73]);
      setCameraRotation(activeSceneConfig.cameraRotation || -4.708758241001718);
      setCameraPitch(activeSceneConfig.cameraPitch || 0);
    }
  }, [activeSceneConfig]);

  useEffect(() => {
    if (!currentConfig?.models) return;
    
    currentConfig.models.forEach((modelConfig, index) => {
      if (modelRefs.current[index]) {
        // Update position
        modelRefs.current[index].position.set(...modelConfig.modelPosition);
        modelPositionsRef.current[index] = [...modelConfig.modelPosition];
        
        // Update rotation
        modelRefs.current[index].rotation.set(...modelConfig.modelRotation);
        modelRotationsRef.current[index] = [...modelConfig.modelRotation];
        
        // Update scale
        modelRefs.current[index].scale.set(...modelConfig.modelScale);
      }
    });
  }, [currentConfig]);

  // Add this if you want to log on every change
  useEffect(() => {
    if (debugMode) {
      logSceneConfig();
    }
  }, [currentConfig, cameraPosition, cameraPitch, cameraRotation, models]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);



  useEffect(() => {
    // Initialize audio context
    audioContextRef.current = new AudioContext();
    analyserRef.current = audioContextRef.current.createAnalyser();
    analyserRef.current.fftSize = 2048;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    dataArrayRef.current = new Float32Array(bufferLength);

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);



  if (!currentConfig) return null;

  const modelConfigs = currentConfig?.models || [];

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        rotation={[cameraPitch, cameraRotation, 0]}
      />
      <CafeEnvironment environmentUrl={environmentUrl} config={currentConfig} />
      
      {modelConfigs
        // Add filter to prevent duplicate agentIds
        .filter((model, index, self) => 
          index === self.findIndex(m => m.agentId === model.agentId)
        )
        .map((modelConfig, index) => {
          return (
            <primitive 
              key={`model-${modelConfig.agentId}`} // Change key to use agentId
              object={modelRefs.current[index] || new Group()}
              position={modelConfig.modelPosition}
              rotation={modelConfig.modelRotation}
              scale={modelConfig.modelScale}
            />
          );
        })}

      <ambientLight intensity={0.7} />
      <directionalLight
        position={[5, 5, 5]}  
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.8} />

      <Environment
        preset="sunset"
        background={false}
        blur={0.8}
      />

      <mesh
        rotation-x={-Math.PI / 2}
        position-y={-1}
        receiveShadow
      >
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial
          color="#232323"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </>
  );
}

export default ThreeScene;