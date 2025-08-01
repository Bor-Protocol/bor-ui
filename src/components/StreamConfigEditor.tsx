import React from 'react';
import { StreamConfigFormData } from '../types/configTypes';
import { DEFAULT_STREAM_CONFIG } from '../utils/constants';
import { LiveStream } from './LiveStream';
import { useScene } from '../contexts/ScenesContext';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173';

const DEFAULT_CONFIG: StreamConfigFormData = {
  streamInfo: {
    title: "Trump stream",
    description: "My first stream!",
    twitter: "@bor_live",
    modelName: "Trump",
    color: "#FE2C55",
    identifier: "Trump",
    type: "stream",
    component: "ThreeScene",
  },
  creatorInfo: {
    username: "Borp",
    avatar: "/images/borp.webp",
    title: "Just hanging out",
  },
  sceneConfig: {
    name: "Cafe",
    environment: {
      file: "tt.glb",
      position: [3, -1, -3.5],
      rotation: [0, 1.5707963267948966, 0],
      scale: [1, 1, 1],
    },
    camera: {
      position: [2.86339364354024, 0.75999999999999, -7.734076601144114],
      rotation: -4.708758241001718,
      pitch: 0,
    },
    character: {
      model: "tromp.vrm",
      name: "Bor",
      agentId: "795df77f-1620-07db-bd9a-0e2dfefef248",
      description: "Bor",
      position: [1.51, -0.4999999999999999, -7.650000000000005],
      rotation: [0, 7.799999999999988, 0],
      scale: [0.9605960100000004, 0.9605960100000004, 0.9605960100000004],
      defaultAnimation: "idlet",
      clothes: "casual",
    },
  },
  audio: {
    bgm: "BGM_URLS.BORP.DEFAULT",
  },
  stats: {
    comments: 0,
  },
};

const dragHandleStyles = {
  userSelect: 'none',
  WebkitUserSelect: 'none',
  msUserSelect: 'none',
  touchAction: 'none',
} as const;

export const StreamConfigEditor: React.FC = () => {
  const { updateScene, newScenes: scenes } = useScene();
  
  // Log initial scenes
  console.log('Initial scenes:', scenes);

  // Load saved config on initial render
  const [config, setConfig] = React.useState<StreamConfigFormData>(() => {
    const savedConfig = localStorage.getItem('stream-config');
    return savedConfig ? JSON.parse(savedConfig) : DEFAULT_CONFIG;
  });

  const [isConfigOpen, setIsConfigOpen] = React.useState(true);
  const [panelHeight, setPanelHeight] = React.useState(25);
  const isDragging = React.useRef(false);
  const initialY = React.useRef(0);
  const initialHeight = React.useRef(0);

  const handleInputChange = (section: keyof StreamConfigFormData, field: string, value: any) => {
    // Add position constraints
    const constrainPosition = (pos: number[]) => {
      return pos.map(val => Math.min(Math.max(val, -100), 100));
    };

    let constrainedValue = value;
    if (section === 'sceneConfig' && field === 'character') {
      if (value.position) {
        value.position = constrainPosition(value.position);
      }
    }

    const newConfig = {
      ...config,
      [section]: {
        ...config[section],
        [field]: constrainedValue
      }
    };
    setConfig(newConfig);
    
    const updatedScene = {
      ...scenes[0],
      sceneConfigs: [{
        ...scenes[0].sceneConfigs[0],
        models: [{
          ...scenes[0].sceneConfigs[0].models[0],
          model: "tromp.vrm",
          name: "Bor",
          agentId: "795df77f-1620-07db-bd9a-0e2dfefef248",
          description: "Bor",
          clothes: "casual",
          defaultAnimation: "idlet",
          modelPosition: newConfig.sceneConfig.character.position,
          modelRotation: newConfig.sceneConfig.character.rotation,
          modelScale: newConfig.sceneConfig.character.scale,
        }],
        environmentPosition: newConfig.sceneConfig.environment.position,
        environmentRotation: newConfig.sceneConfig.environment.rotation,
        environmentScale: newConfig.sceneConfig.environment.scale,
        cameraPosition: newConfig.sceneConfig.camera.position,
        cameraRotation: newConfig.sceneConfig.camera.rotation,
        id: scenes[0].sceneConfigs[0].id,
        name: scenes[0].sceneConfigs[0].name,
        environmentURL: "tt.glb",
      }],
      id: scenes[0].id,
      title: scenes[0].title,
      type: "stream",
      component: "ThreeScene",
    };
    
    console.log('Updating scene with:', updatedScene);
    updateScene(updatedScene);
    localStorage.setItem('stream-config', JSON.stringify(newConfig));
  };

  const exportConfig = () => {
    // Convert current config to NEW_STREAM_CONFIGS format
    const exportedConfig = {
      id: scenes[0].id,
      title: config.streamInfo.title,
      agentId: config.sceneConfig.character.agentId,
      twitter: config.streamInfo.twitter,
      modelName: config.streamInfo.modelName,
      identifier: config.streamInfo.identifier,
      description: config.streamInfo.description,
      color: config.streamInfo.color,
      type: config.streamInfo.type,
      component: config.streamInfo.component,
      creator: {
        avatar: config.creatorInfo.avatar,
        title: config.creatorInfo.title,
        username: config.creatorInfo.username
      },
      bgm: config.audio.bgm,
      sceneConfigs: [{
        id: scenes[0].sceneConfigs[0].id,
        name: config.sceneConfig.name,
        environmentURL: "tt.glb",
        models: [{
          model: "tromp.vrm",
          name: "Bor",
          agentId: "795df77f-1620-07db-bd9a-0e2dfefef248",
          description: "Bor",
          clothes: "casual",
          defaultAnimation: "idlet",
          modelPosition: config.sceneConfig.character.position,
          modelRotation: config.sceneConfig.character.rotation,
          modelScale: config.sceneConfig.character.scale
        }],
        environmentScale: config.sceneConfig.environment.scale,
        environmentPosition: config.sceneConfig.environment.position,
        environmentRotation: config.sceneConfig.environment.rotation,
        cameraPitch: config.sceneConfig.camera.pitch || 0,
        cameraPosition: config.sceneConfig.camera.position,
        cameraRotation: config.sceneConfig.camera.rotation
      }],
      stats: config.stats,
      clothes: "casual"
    };

    // Create the file content with proper formatting
    const fileContent = `export const NEW_STREAM_CONFIGS = ${JSON.stringify(exportedConfig, null, 2)};`;
    
    // Create and download the file
    const blob = new Blob([fileContent], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sceneConfig.ts';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem('stream-config', JSON.stringify(config));
      exportConfig();
      alert('Configuration exported! Replace your sceneConfig.ts file with the downloaded file.');
    } catch (error) {
      console.error('Error exporting configuration:', error);
      alert('Error exporting configuration');
    }
  };

  const handleReset = () => {
    // Clear localStorage
    localStorage.removeItem('stream-config');
    
    // Reset to default config
    setConfig(DEFAULT_CONFIG);
    
    // Update scene with default values
    const defaultScene = {
      ...scenes[0],
      sceneConfigs: [{
        ...scenes[0].sceneConfigs[0],
        models: [{
          ...scenes[0].sceneConfigs[0].models[0],
          modelPosition: DEFAULT_CONFIG.sceneConfig.character.position,
          modelRotation: DEFAULT_CONFIG.sceneConfig.character.rotation,
          modelScale: DEFAULT_CONFIG.sceneConfig.character.scale,
        }],
        environmentPosition: DEFAULT_CONFIG.sceneConfig.environment.position,
        environmentRotation: DEFAULT_CONFIG.sceneConfig.environment.rotation,
        environmentScale: DEFAULT_CONFIG.sceneConfig.environment.scale,
        cameraPosition: DEFAULT_CONFIG.sceneConfig.camera.position,
        cameraRotation: DEFAULT_CONFIG.sceneConfig.camera.rotation,
      }]
    };
    
    updateScene(defaultScene);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    initialY.current = e.clientY;
    initialHeight.current = panelHeight;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;
    
    const deltaY = initialY.current - e.clientY;
    const deltaPercent = (deltaY / window.innerHeight) * 100;
    const newHeight = initialHeight.current + deltaPercent;
    
    setPanelHeight(Math.min(Math.max(newHeight, 10), 90));
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const Vector3Input = ({ label, values, onChange }: { 
    label: string, 
    values: number[], 
    onChange: (newValues: number[]) => void 
  }) => {
    const [tempValues, setTempValues] = React.useState(values);

    React.useEffect(() => {
      setTempValues(values);
    }, [values]);

    return (
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex gap-4">
          {['X', 'Y', 'Z'].map((axis, index) => (
            <div key={axis} className="flex-1">
              <label className="text-xs text-gray-500">{axis}</label>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const newValues = [...values];
                    newValues[index] -= 0.1;
                    onChange(newValues);
                  }}
                  className="px-2 py-1 bg-gray-200 rounded-l hover:bg-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  step="0.1"
                  value={tempValues[index]}
                  onChange={(e) => {
                    const newTemp = [...tempValues];
                    newTemp[index] = parseFloat(e.target.value);
                    setTempValues(newTemp);
                  }}
                  onBlur={() => {
                    onChange(tempValues);
                  }}
                  className="w-20 text-center border-gray-300"
                />
                <button
                  onClick={() => {
                    const newValues = [...values];
                    newValues[index] += 0.1;
                    onChange(newValues);
                  }}
                  className="px-2 py-1 bg-gray-200 rounded-r hover:bg-gray-300"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="relative h-screen">
      {/* Full-screen LiveStream - Lowest z-index */}
      <div className="w-full h-full absolute inset-0" style={{ zIndex: 0 }}>
        <LiveStream 
          config={config}
          isPreview={true}
        />
      </div>

      {/* Floating Config Button - Highest z-index */}
      <button
        onClick={() => setIsConfigOpen(!isConfigOpen)}
        className="fixed top-4 right-4 bg-gray-800/90 text-white p-2 rounded-md"
        style={{ zIndex: 1000 }}
      >
        {isConfigOpen ? 'Hide Config' : 'Show Config'}
      </button>

      {/* Floating Config Panel - High z-index */}
      {isConfigOpen && (
        <div 
          className="fixed left-0 right-0 bg-white/90 backdrop-blur-sm border-t border-gray-200 shadow-lg overflow-hidden"
          style={{ 
            zIndex: 999,
            height: `${panelHeight}%`,
            bottom: 0
          }}
        >
          {/* Drag Handle */}
          <div 
            className="absolute top-0 left-0 right-0 h-6 cursor-ns-resize bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center"
            onMouseDown={handleMouseDown}
            style={dragHandleStyles}
          >
            <div className="space-y-1">
              <div className="w-16 h-1 bg-gray-400 rounded-full"/>
              <div className="w-16 h-1 bg-gray-300 rounded-full"/>
            </div>
          </div>

          {/* Fixed Header */}
          <div className="sticky top-6 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold">Stream Configuration</h1>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleReset}
                className="bg-gray-500 text-white px-3 py-1 rounded-md text-sm"
              >
                Reset
              </button>
              <button
                onClick={handleSubmit}
                className="bg-blue-500 text-white px-3 py-1 rounded-md text-sm"
              >
                Export Config
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto h-[calc(100%-6rem)]">
            <div className="p-4">
              <div className="flex gap-8 overflow-x-auto pb-6">
                {/* Further increased widths and gaps */}
                <section className="flex-none w-96 p-6 bg-gray-50 rounded-lg">
                  <h2 className="text-sm font-semibold mb-4">Stream Info</h2>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={config.streamInfo.title}
                      onChange={(e) => handleInputChange('streamInfo', 'title', e.target.value)}
                      placeholder="Title"
                      className="w-full px-2 py-1 text-sm rounded border"
                    />
                    <input
                      type="text"
                      value={config.streamInfo.description}
                      onChange={(e) => handleInputChange('streamInfo', 'description', e.target.value)}
                      placeholder="Description"
                      className="w-full px-2 py-1 text-sm rounded border"
                    />
                    <input
                      type="text"
                      value={config.streamInfo.twitter}
                      onChange={(e) => handleInputChange('streamInfo', 'twitter', e.target.value)}
                      placeholder="Twitter"
                      className="w-full px-2 py-1 text-sm rounded border"
                    />
                    <input
                      type="text"
                      value={config.streamInfo.modelName}
                      onChange={(e) => handleInputChange('streamInfo', 'modelName', e.target.value)}
                      placeholder="Model Name"
                      className="w-full px-2 py-1 text-sm rounded border"
                    />
                    <input
                      type="color"
                      value={config.streamInfo.color}
                      onChange={(e) => handleInputChange('streamInfo', 'color', e.target.value)}
                      className="w-full px-2 py-1 text-sm rounded border"
                    />
                  </div>
                </section>

                <section className="flex-none w-[600px] p-6 bg-gray-50 rounded-lg">
                  <h2 className="text-sm font-semibold mb-4">Camera</h2>
                  <div className="space-y-6">
                    <Vector3Input
                      label="Camera Position"
                      values={config.sceneConfig.camera.position}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'camera', {
                          ...config.sceneConfig.camera,
                          position: newValues
                        });
                      }}
                    />
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Rotation</label>
                      <input
                        type="number"
                        step="0.1"
                        value={config.sceneConfig.camera.rotation}
                        onChange={(e) => {
                          handleInputChange('sceneConfig', 'camera', {
                            ...config.sceneConfig.camera,
                            rotation: parseFloat(e.target.value)
                          });
                        }}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </section>

                <section className="flex-none w-[600px] p-6 bg-gray-50 rounded-lg">
                  <h2 className="text-sm font-semibold mb-4">Character</h2>
                  <div className="space-y-6">
                    <Vector3Input
                      label="Position"
                      values={config.sceneConfig.character.position}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'character', {
                          ...config.sceneConfig.character,
                          position: newValues
                        });
                      }}
                    />
                    <Vector3Input
                      label="Rotation"
                      values={config.sceneConfig.character.rotation}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'character', {
                          ...config.sceneConfig.character,
                          rotation: newValues
                        });
                      }}
                    />
                    <Vector3Input
                      label="Scale"
                      values={config.sceneConfig.character.scale}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'character', {
                          ...config.sceneConfig.character,
                          scale: newValues
                        });
                      }}
                    />
                  </div>
                </section>

                <section className="flex-none w-[600px] p-6 bg-gray-50 rounded-lg">
                  <h2 className="text-sm font-semibold mb-4">Environment</h2>
                  <div className="space-y-6">
                    <Vector3Input
                      label="Position"
                      values={config.sceneConfig.environment.position}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'environment', {
                          ...config.sceneConfig.environment,
                          position: newValues
                        });
                      }}
                    />
                    <Vector3Input
                      label="Rotation"
                      values={config.sceneConfig.environment.rotation}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'environment', {
                          ...config.sceneConfig.environment,
                          rotation: newValues
                        });
                      }}
                    />
                    <Vector3Input
                      label="Scale"
                      values={config.sceneConfig.environment.scale}
                      onChange={(newValues) => {
                        handleInputChange('sceneConfig', 'environment', {
                          ...config.sceneConfig.environment,
                          scale: newValues
                        });
                      }}
                    />
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 