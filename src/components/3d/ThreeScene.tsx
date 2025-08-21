import { useEffect, useRef, useCallback, useState, useMemo, memo } from 'react';
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
  LoopRepeat,
  MeshStandardMaterial,
  FrontSide
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
  '/animations/blow_a_kiss.fbx',
  '/animations/dismissing_gesture.fbx',
  '/animations/happy_hand_gesture.fbx',
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







function ThreeSceneComponent({ debugMode, forceMaterialConversion = true }: { debugMode: boolean, forceMaterialConversion?: boolean }) {
  const modelRefs = useRef<(Group | undefined)[]>([]);
  const vrmRefs = useRef<any[]>([]);
  const mixerRefs = useRef<(AnimationMixer | undefined)[]>([]); 
  const actionsRefs = useRef<{ [key: string]: AnimationAction }[]>([]);

  const clockRef = useRef<Clock>();
  const currentActionRef = useRef<string | null>(null);
  const nextAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { animation, animationFile, audioData } = useSceneEngine();
  const { newScenes, activeScene, sceneConfigIndex } = useScene();
  const scene = newScenes[activeScene];

  const activeSceneConfig: SceneConfig = useMemo(() => scene?.sceneConfigs[sceneConfigIndex], [scene, sceneConfigIndex])
  const environmentUrl = activeSceneConfig?.environmentURL

  const models = activeSceneConfig?.models || [];

  // This is the config we use for the scene
  const [sceneConfig, setSceneConfig] = useState<SceneConfig>(activeSceneConfig);

  console.log({sceneConfig})

  // This is the index of the model we are currently using (editor)

  // Add camera position state
  const [cameraPosition, setCameraPosition] = useState<[number, number, number]>(sceneConfig.cameraPosition);
  const [cameraRotation, setCameraRotation] = useState<number>(sceneConfig.cameraRotation);
  const [cameraPitch, setCameraPitch] = useState<number>(sceneConfig.cameraPitch);

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


  // Add a cleanup function to clear models with proper disposal
  const cleanupModels = useCallback(() => {
    console.log('🧹 Starting comprehensive memory cleanup...');
    // Dispose of Three.js objects properly
    modelRefs.current.forEach((model, index) => {
      if (model) {
        // Traverse and dispose of all geometries and materials
        model.traverse((object: any) => {
          if (object.isMesh) {
            // Dispose geometry
            if (object.geometry) {
              object.geometry.dispose();
              object.geometry = null;
            }
            
            // Dispose materials (handle both single material and material arrays)
            if (object.material) {
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material: any) => {
                // Dispose all possible textures
                const texturesToDispose = [
                  'map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap',
                  'bumpMap', 'displacementMap', 'lightMap', 'envMap', 'specularMap',
                  'alphaMap', 'gradientMap', 'clearcoatMap', 'clearcoatNormalMap',
                  'clearcoatRoughnessMap', 'transmissionMap', 'thicknessMap',
                  'sheenColorMap', 'sheenRoughnessMap', 'specularIntensityMap',
                  'specularColorMap', 'iridescenceMap', 'iridescenceThicknessMap'
                ];
                
                texturesToDispose.forEach(textureProperty => {
                  if (material[textureProperty]) {
                    material[textureProperty].dispose();
                    material[textureProperty] = null;
                  }
                });
                
                // Dispose material
                material.dispose();
              });
              
              // Clear material reference
              object.material = null;
            }
          }
          
          // Dispose additional object properties
          if (object.skeleton) {
            object.skeleton.dispose();
          }
          
          if (object.morphTargetInfluences) {
            object.morphTargetInfluences = null;
          }
          
          if (object.userData) {
            object.userData = {};
          }
        });
        
        // Remove from parent and clear the model
        if (model.parent) {
          model.parent.remove(model);
        }
        model.clear();
        
        // Dispose of any remaining children
        while (model.children.length > 0) {
          const child = model.children[0];
          model.remove(child);
          if (child.dispose) {
            child.dispose();
          }
        }
      }
      
      // Stop and dispose animation mixers
      if (mixerRefs.current[index]) {
        const mixer = mixerRefs.current[index]!;
        mixer.stopAllAction();
        
        // Uncache all clips to free memory
        mixer.uncacheRoot(mixer.getRoot());
        
        // Remove all event listeners
        mixer.removeEventListener('finished', () => {});
        mixer.removeEventListener('loop', () => {});
        
        // Clear actions
        if (actionsRefs.current[index]) {
          Object.values(actionsRefs.current[index]).forEach(action => {
            if (action) {
              action.stop();
            }
          });
        }
      }
    });
    
    // Dispose VRM instances
    vrmRefs.current.forEach((vrm) => {
      if (vrm) {
        if (vrm.expressionManager) {
          vrm.expressionManager.destroy();
        }
        if (vrm.humanoid && typeof vrm.humanoid.dispose === 'function') {
          vrm.humanoid.dispose();
        }
        if (vrm.springBoneManager && typeof vrm.springBoneManager.dispose === 'function') {
          vrm.springBoneManager.dispose();
        }
      }
    });
    
    // Clear all references
    modelRefs.current = [];
    vrmRefs.current = [];
    mixerRefs.current = [];
    actionsRefs.current = [];
    
    // Clear animation timeouts
    if (nextAnimationTimeoutRef.current) {
      clearTimeout(nextAnimationTimeoutRef.current);
      nextAnimationTimeoutRef.current = null;
    }
    
    // Dispose audio context and related objects
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    
    if (dataArrayRef.current) {
      dataArrayRef.current = null;
    }
    
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    console.log('✅ Memory cleanup completed successfully');
  }, []);

  // Add loading state
  const [, setModelsLoaded] = useState<boolean[]>([]);
  const [, setAllModelsLoaded] = useState(false);
  
  // Create GLTFLoader singleton
  const loaderRef = useRef<GLTFLoader>();
  if (!loaderRef.current) {
    loaderRef.current = new GLTFLoader();
    loaderRef.current.register((parser) => {
      return new VRMLoaderPlugin(parser, {
        autoUpdateHumanBones: true
      });
    });
  }

  // Modify the model loading effect
  useEffect(() => {
    if (!sceneConfig) return;

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

    // Use singleton loader
    const loader = loaderRef.current;
    if (!loader) return;

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
              
              // Enable shadows and update materials to respond to lights
              if (obj.isMesh) {
                obj.castShadow = true;
                obj.receiveShadow = true;
                
                // Convert VRM materials to standard materials that respond to lights (optional)
                if (obj.material && forceMaterialConversion) {
                  // Handle material arrays
                  const materials = Array.isArray(obj.material) ? obj.material : [obj.material];
                  
                  materials.forEach((material: any, matIndex: number) => {
                    // Store original material properties
                    const originalColor = material.color ? material.color.clone() : null;
                    const originalMap = material.map || null;
                    const originalNormalMap = material.normalMap || null;
                    const originalRoughnessMap = material.roughnessMap || null;
                    const originalMetalnessMap = material.metalnessMap || null;
                    
                    // Force convert ALL materials to MeshStandardMaterial for light response
                    if (!material.isMeshStandardMaterial) {
                      const newMaterial = new MeshStandardMaterial({
                        color: originalColor || 0xffffff,
                        map: originalMap,
                        normalMap: originalNormalMap,
                        roughnessMap: originalRoughnessMap,
                        metalnessMap: originalMetalnessMap,
                        roughness: 0.6,
                        metalness: 0.1,
                        emissive: 0x000000,
                        emissiveIntensity: 0
                      });
                      
                      // Preserve transparency
                      if (material.transparent) {
                        newMaterial.transparent = true;
                        newMaterial.opacity = material.opacity || 1.0;
                        newMaterial.alphaTest = material.alphaTest || 0;
                      }
                      
                      // Preserve side settings
                      newMaterial.side = material.side || FrontSide;
                      
                      // Dispose old material before replacing
                      material.dispose();
                      
                      // Update the material
                      if (Array.isArray(obj.material)) {
                        obj.material[matIndex] = newMaterial;
                      } else {
                        obj.material = newMaterial;
                      }
                    }
                  });
                }
              }
            });

            VRMUtils.rotateVRM0(vrm);

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
      
      // Dispose GLTFLoader
      if (loaderRef.current) {
        loaderRef.current = undefined;
      }
    };
  }, [models, cleanupModels]); // Add models to dependency array to reload when they change

  // Component unmount cleanup
  useEffect(() => {
    return () => {
      cleanupModels();
      
      // Dispose GLTFLoader
      if (loaderRef.current) {
        loaderRef.current = undefined;
      }
      
      // Dispose clock
      if (clockRef.current) {
        clockRef.current = undefined;
      }
    };
  }, []); // Only run on unmount

  // Initialize clock singleton
  if (!clockRef.current) {
    clockRef.current = new Clock();
  }

  // Update animation frame
  useFrame(() => {
    const clock = clockRef.current!;
    const delta = clock.getDelta();

    // Update mixers
    if (mixerRefs.current) {
      mixerRefs.current.forEach(mixer => {
        if (mixer) {
          mixer.update(delta);
        }
      });
    }

    if (vrmRefs.current) {
      const elapsedTime = clock.elapsedTime;

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

        // Blinking logic (existing code)
        const blinkInterval = 5;
        const blinkDuration = 0.2;
        const doubleBlink = Math.floor(elapsedTime / blinkInterval) % 2 === 1;
        const timeSinceLastInterval = elapsedTime % blinkInterval;

        let blinkValue = 0;

        if (timeSinceLastInterval < blinkDuration) {
          blinkValue = Math.cos(Math.PI * timeSinceLastInterval / blinkDuration) * 0.5 + 0.5;
        }

        if (doubleBlink && timeSinceLastInterval > blinkDuration + 0.15 && timeSinceLastInterval < (2 * blinkDuration + 0.15)) {
          blinkValue = Math.cos(Math.PI * (timeSinceLastInterval - blinkDuration - 0.15) / blinkDuration) * 0.5 + 0.5;
        }

        vrm.expressionManager.setValue('blinkLeft', blinkValue);
        vrm.expressionManager.setValue('blinkRight', blinkValue);

        vrm.update(delta);
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
      environmentScale: sceneConfig.environmentScale,
      environmentPosition: sceneConfig.environmentPosition,
      environmentRotation: sceneConfig.environmentRotation,
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
      setCameraPosition(activeSceneConfig.cameraPosition);
      setCameraRotation(activeSceneConfig.cameraRotation);
      setCameraPitch(activeSceneConfig.cameraPitch);
    }
  }, [activeSceneConfig]);

  useEffect(() => {
    if (!sceneConfig?.models) return;
    
    sceneConfig.models.forEach((modelConfig, index) => {
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
  }, [sceneConfig]);

  // Add this if you want to log on every change
  useEffect(() => {
    if (debugMode) {
      logSceneConfig();
    }
  }, [sceneConfig, cameraPosition, cameraPitch, cameraRotation, models]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Float32Array | null>(null);



  useEffect(() => {
    // Initialize audio context (singleton pattern)
    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      
      const bufferLength = analyserRef.current.frequencyBinCount;
      dataArrayRef.current = new Float32Array(bufferLength);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []); // Empty dependency array - only run once



  if (!sceneConfig) return null;

  const modelConfigs = sceneConfig?.models || [];

  return (
    <>
      <PerspectiveCamera
        makeDefault
        position={cameraPosition}
        rotation={[cameraPitch, cameraRotation, 0]}
      />
      {modelConfigs
        // Add filter to prevent duplicate agentIds
        .filter((model, index, self) => 
          index === self.findIndex(m => m.agentId === model.agentId)
        )
        .map((modelConfig, index) => {
          console.log(`Rendering model ${index}:`, {
            ref: modelRefs.current[index],
            position: modelConfig.modelPosition,
            agentId: modelConfig.agentId
          });
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

      {/* Simple lighting for white background */}
      <ambientLight intensity={1.2} color="#ffffff" />
      
      {/* Main directional light */}
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.5}
        color="#ffffff"
        castShadow={false}
      />
      
      {/* Side accent light (as requested) */}
      <directionalLight
        position={[-3, 5, 2]}
        intensity={1.0}
        color="#ffcc66"
      />
      
      {/* Red side light from the left */}
      <directionalLight
        position={[-5, 2, 1]}
        intensity={1.2}
        color="#ff3333"
        castShadow={false}
      />
      
      {/* Debug helpers to visualize lights */}
      {debugMode && (
        <>
          <mesh position={[-2, 1.5, 1]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ffcc66" />
          </mesh>
          <mesh position={[-2.5, 1.2, 0.5]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color="#ffa500" />
          </mesh>
        </>
      )}

    </>
  );
}

export default memo(ThreeSceneComponent);