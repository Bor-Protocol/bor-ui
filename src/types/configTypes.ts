export interface StreamConfigFormData {
  // Basic Stream Info
  streamInfo: {
    title: string;
    description: string;
    twitter: string;
    modelName: string;
    color: string;
    identifier: string;
    type: string;
    component: string;
  };
  
  // Creator Info
  creatorInfo: {
    username: string;
    avatar: string;
    title: string;
  };
  
  // Scene Configuration
  sceneConfig: {
    name: string;
    environment: {
      file: string;
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    };
    
    camera: {
      position: [number, number, number];
      rotation: number;
      pitch: number;
    };
    
    character: {
      model: string;
      name: string;
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
      defaultAnimation: string;
      clothes: string;
      agentId: string;
      description: string;
    };
  };
  
  // Audio Settings
  audio: {
    bgm: string;
  };
  
  // Add stats property
  stats: {
    comments: number;
  };
} 