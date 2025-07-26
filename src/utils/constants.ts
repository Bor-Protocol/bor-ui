//Configuration Constants



// Add BGM URL constants
export const BGM_URLS = {
   BORP: {
       DEFAULT: '/audio/musicbg.mp3'
   },
} as const;


export const NEW_STREAM_CONFIGS: NewStreamConfig[] = [
 {
   id: 0,
   title: "Trump Live Stream",
   agentId: "795df77f-1620-07db-bd9a-0e2dfefef248", // Will be replaced with actual Trump agent ID
   twitter: "@realDonaldTrump",
   modelName: "Trump",
   identifier: "trump",
   description: "Make America Great Again - Live!",
   color: "#FF0000",
   type: "stream",
   component: "ThreeScene",
   creator: { avatar: "/images/trump-avatar.webp", title: "MAGA Rally", username: "Trump" },
   bgm: BGM_URLS.BORP.DEFAULT,
   sceneConfigs: [
     {
       "id": 0,
       "name": "Trump Rally Stage",
       "environmentURL": "tt.glb",
       "models": [
         {
           "model": "trump.vrm",
           "name": "Trump",
           "agentId": "795df77f-1620-07db-bd9a-0e2dfefef248",
           "description": "Donald Trump",
           "clothes": "suit",
           "defaultAnimation": "idlet",
           "modelPosition": [1.51, -0.5, -7.65],
           "modelRotation": [0, 7.8, 0],
           "modelScale": [0.96, 0.96, 0.96]
         }
       ],
       "environmentScale": [1, 1, 1],
       "environmentPosition": [3, -1, -3.5],
       "environmentRotation": [0, 1.5707963267948966, 0],
       "cameraPitch": 0,
       "cameraPosition": [2.86, 0.76, -7.73],
       "cameraRotation": -4.708758241001718
     }
   ],
   stats: { comments: 0 },
   clothes: "suit"
 },
 {
   id: 1,
   title: "Borp Original Stream",
   agentId: "c9a175eb-deb5-06b1-886b-ef4f876a5be2",
   twitter: "@bor_live",
   modelName: "Borp",
   identifier: "borp",
   description: "The original Borp experience!",
   color: "#FE2C55",
   type: "stream",
   component: "ThreeScene",
   creator: { avatar: "/images/borp.webp", title: "Just hanging out", username: "Borp" },
   bgm: BGM_URLS.BORP.DEFAULT,
   sceneConfigs: [
     {
       "id": 1,
       "name": "Cafe",
       "environmentURL": "tt.glb",
       "models": [
         {
           "model": "bor_model.vrm",
           "name": "Bor",
           "agentId": "c9a175eb-deb5-06b1-886b-ef4f876a5be2",
           "description": "Bor",
           "clothes": "casual",
           "defaultAnimation": "idlet",
           "modelPosition": [1.51, -0.5, -7.65],
           "modelRotation": [0, 7.8, 0],
           "modelScale": [0.96, 0.96, 0.96]
         }
       ],
       "environmentScale": [1, 1, 1],
       "environmentPosition": [3, -1, -3.5],
       "environmentRotation": [0, 1.5707963267948966, 0],
       "cameraPitch": 0,
       "cameraPosition": [2.86, 0.76, -7.73],
       "cameraRotation": -4.708758241001718
     }
   ],
   stats: { comments: 0 },
   clothes: "casual"
 },
 {
   id: 2,
   title: "Agent Alpha Stream",
   agentId: "c9a175eb-deb5-06b1-886b-ef4f876a5be2", // Will be replaced with actual Alpha agent ID
   twitter: "@agent_alpha",
   modelName: "Agent-Alpha",
   identifier: "alpha",
   description: "Technical Operations Hub",
   color: "#0066FF",
   type: "stream",
   component: "ThreeScene",
   creator: { avatar: "/images/alpha-avatar.webp", title: "System Coordinator", username: "Alpha" },
   bgm: BGM_URLS.BORP.DEFAULT,
   sceneConfigs: [
     {
       "id": 2,
       "name": "Tech Lab",
       "environmentURL": "tt.glb",
       "models": [
         {
           "model": "testtrump.vrm",
           "name": "Agent Alpha",
           "agentId": "c9a175eb-deb5-06b1-886b-ef4f876a5be2",
           "description": "Agent Alpha - Technical Coordinator",
           "clothes": "professional",
           "defaultAnimation": "idle",
           "modelPosition": [1.51, -0.5, -7.65],
           "modelRotation": [0, 7.8, 0],
           "modelScale": [0.96, 0.96, 0.96]
         }
       ],
       "environmentScale": [1, 1, 1],
       "environmentPosition": [3, -1, -3.5],
       "environmentRotation": [0, 1.5707963267948966, 0],
       "cameraPitch": 0,
       "cameraPosition": [2.86, 0.76, -7.73],
       "cameraRotation": -4.708758241001718
     }
   ],
   stats: { comments: 0 },
   clothes: "professional"
 }
 /*,
 {
   id: 3,
   title: "Agent Beta Stream",
   agentId: "agent-beta-id", // Will be replaced with actual Beta agent ID
   twitter: "@agent_beta",
   modelName: "Agent-Beta",
   identifier: "beta",
   description: "Monitoring & Analysis Hub",
   color: "#00FF66",
   type: "stream",
   component: "ThreeScene",
   creator: { avatar: "/images/beta-avatar.webp", title: "System Monitor", username: "Beta" },
   bgm: BGM_URLS.BORP.DEFAULT,
   sceneConfigs: [
     {
       "id": 3,
       "name": "Control Room",
       "environmentURL": "tt.glb",
       "models": [
         {
           "model": "bor_model.vrm",
           "name": "Agent Beta",
           "agentId": "agent-beta-id",
           "description": "Agent Beta - Monitoring Specialist",
           "clothes": "tech",
           "defaultAnimation": "idle_basic",
           "modelPosition": [1.51, -0.5, -7.65],
           "modelRotation": [0, 7.8, 0],
           "modelScale": [0.96, 0.96, 0.96]
         }
       ],
       "environmentScale": [1, 1, 1],
       "environmentPosition": [3, -1, -3.5],
       "environmentRotation": [0, 1.5707963267948966, 0],
       "cameraPitch": 0,
       "cameraPosition": [2.86, 0.76, -7.73],
       "cameraRotation": -4.708758241001718
     }
   ],
   stats: { comments: 0 },
   clothes: "tech"
 },
 {
   id: 4,
   title: "Agent Gamma Stream",
   agentId: "agent-gamma-id", // Will be replaced with actual Gamma agent ID
   twitter: "@agent_gamma",
   modelName: "Agent-Gamma",
   identifier: "gamma",
   description: "Data Analytics Hub",
   color: "#FF6600",
   type: "stream",
   component: "ThreeScene",
   creator: { avatar: "/images/gamma-avatar.webp", title: "Data Analyst", username: "Gamma" },
   bgm: BGM_URLS.BORP.DEFAULT,
   sceneConfigs: [
     {
       "id": 4,
       "name": "Data Center",
       "environmentURL": "tt.glb",
       "models": [
         {
           "model": "bor_model.vrm",
           "name": "Agent Gamma",
           "agentId": "agent-gamma-id",
           "description": "Agent Gamma - Data Specialist",
           "clothes": "formal",
           "defaultAnimation": "offensive_idle",
           "modelPosition": [1.51, -0.5, -7.65],
           "modelRotation": [0, 7.8, 0],
           "modelScale": [0.96, 0.96, 0.96]
         }
       ],
       "environmentScale": [1, 1, 1],
       "environmentPosition": [3, -1, -3.5],
       "environmentRotation": [0, 1.5707963267948966, 0],
       "cameraPitch": 0,
       "cameraPosition": [2.86, 0.76, -7.73],
       "cameraRotation": -4.708758241001718
     }
   ],
   stats: { comments: 0 },
   clothes: "formal"
 }*/
]

export const ANIMATION_MAP: { [key: string]: string } = {
  "pointing": "Pointing.fbx",
  "light_dance": "light_dance.fbx",
  "hands_up": "hands_up.fbx",
  "trump_dance": "trump_dance.fbx",
  "listening_to_music": "Listening_To_Music.fbx",
  "play_golf": "play_golf.fbx",
  "cheering": "cheering.fbx",
  "fist_up": "fist_up.fbx",
   "acknowledging": "acknowledging.fbx",
   "angry_gesture": "angry_gesture.fbx",
   "annoyed_head_shake": "annoyed_head_shake.fbx",
   "appearing": "appearing.fbx",
   "being_cocky": "being_cocky.fbx",
  //  "blow_a_kiss": "blow_a_kiss.fbx",
   "got_assasinated": "brutal_assassination.fbx",
  //  "dancing_twerk": "dancing_twerk.fbx",
   "hip_hop_dancing": "hip_hop_dancing.fbx",
   "floating": "idle/floating.fbx",
   "capoeira": ".fbx",
   "dismissing_gesture": "dismissing_gesture.fbx",
  //  "happy_hand_gesture": "happy_hand_gesture.fbx",
   "hard_head_nod": "hard_head_nod.fbx",
   "head_nod_yes": "head_nod_yes.fbx",
   "idle": "idle-2.fbx",
   "idlet": "idlet.fbx",
   "idle-2": "idle-2.fbx",
   "idle_basic": "idle.fbx",
   "weight_shift": "weight_shift.fbx",
   "idle_dwarf": "idle/idle_dwarf.fbx",
  //  "joyful_jump": "joyful_jump.fbx",
   "laughing": "laughing.fbx",
   "lengthy_head_nod": "lengthy_head_nod.fbx",
   "look_away_gesture": "look_away_gesture.fbx",
   "offensive_idle": "offensive_idle.fbx",
   "relieved_sigh": "relieved_sigh.fbx",
   "rumba_dancing": "rumba_dancing.fbx",
   "sarcastic_head_nod": "sarcastic_head_nod.fbx",
   "shaking_head_no": "shaking_head_no.fbx",
   "silly_dancing": "silly_dancing.fbx",
   "sitting_disbelief": "sitting_disbelief.fbx",
   "sitting_legs_swinging": "sitting_legs_swinging.fbx",
   "sitting_yell": "sitting_yell.fbx",
   "sitting": "sitting.fbx",
   "standing_clap": "standing_clap.fbx",
   "thoughtful_head_shake": "thoughtful_head_shake.fbx",
   "walk_with_rifle": "walk_with_rifle.fbx",
  //  "belly_dance": "dance/belly_dance.fbx",
  //  "maraschino": "dance/maraschino.fbx",
   "defeated": "defeated.fbx",
   "praying": "praying.fbx",
   "hiphop_dancing": "hiphop_dancing.fbx",
   "angry": "angry.fbx",
   "happy_idle": "happy_idle.fbx",
   "robot_dance": "robot_dance.fbx",
   "bboy_hiphopmove": "bboy_hiphopmove.fbx",
   "swing_dancing": "swing_dancing.fbx",
   "nervously_look_around": "nervously_look_around.fbx",
   "arm_stretching": "arm_stretching.fbx",
   "salute": "salute.fbx",
   "excited": "excited.fbx",
   "greeting": "greeting.fbx",
   "arguing": "arguing.fbx",
   "chicken_dance": "chicken_dance.fbx",
   "youre_loser": "youre_loser.fbx",
   "look_around": "look_around.fbx",
   "saying_no": "saying_no.fbx",
   "shaking_hands": "shaking_hands.fbx",
   "insulting": "insulting.fbx",
   "threatening": "threatening.fbx",
   "happy": "happy.fbx",
   "are_you_crazy": "are_you_crazy.fbx",
   "focusing": "focusing.fbx",
   "speedbag_boxing": "speedbag_boxing.fbx",



};


// SCENES

// URLS to import animations, environments, and models
export const ANIMATIONS_BASE_URL = '/animations';
export const ENVIRONMENTS_BASE_URL = '/environments';
export const MODELS_BASE_URL = '/models';

// should just be key of ANIMATION_MAP
export const getAnimationUrl = (animation: keyof typeof ANIMATION_MAP) => {
   const animationFile = ANIMATION_MAP[animation];
   const animationUrl = `${ANIMATIONS_BASE_URL}/${animationFile}`;
   console.log('🎬 Getting Animation URL:', {
       animation,
       animationFile,
       fullUrl: animationUrl
   });
   return animationUrl;
};
export const getEnvironmentUrl = (environment: string) => {
   return `${ENVIRONMENTS_BASE_URL}/${environment}`;
}
export const getModelUrl = (model: string) => `${MODELS_BASE_URL}/${model}`;



const MESSAGE_TIMEOUTS = {
   "small": 3000,    // For messages < 50 chars
   "medium": 8000,  // For messages 50-150 chars
   "large": 12000    // For messages > 150 chars
}

export const getMessageTimeout = (text: string): number => {
   const charCount = text.length;
   if (charCount < 100) return MESSAGE_TIMEOUTS.small;
   if (charCount <= 200) return MESSAGE_TIMEOUTS.medium;
   return MESSAGE_TIMEOUTS.large;
}


// Used for the gift modal and any other quick lookups
// Should be replaced with DB
export const AGENT_MAP: { [agentId: string]: { name: string } } = {
  "a9f3105f-7b14-09bd-919f-a1482637a374": {
      name: "Borp",
  },
   
}


//api && socket

export const SOCKET_URL = 'ws://localhost:6969'
export const API_URL = 'http://localhost:6969'

// Model access configuration
export const FREE_MODEL_AGENT_ID = '795df77f-1620-07db-bd9a-0e2dfefef248'; // Trump model


export const SOCKET_EVENTS = {
   CONNECTION: 'connection',
   DISCONNECT: 'disconnect',
   NEW_COMMENT: 'new comment',
   CONNECTED: 'connected'
} as const;


//*******Abstraction Interfaces*******

interface Model {
  model: string; // model file name -- must be a vrm file located in the public/models folder
  name: string; // model name -- unused
  description: string; // model description -- unused
  agentId: string; // needed to set up animation/aiReply/audio handlers per model, coming in from the server
  clothes: string; // unused
  defaultAnimation: string; // animation to play when the model is loaded
  modelPosition: [number, number, number]; // position of the model in the scene
  modelRotation: [number, number, number]; // rotation of the model in the scene
  modelScale: [number, number, number]; // scale of the model in the scene 
 }
 
 export interface SceneConfig {
  id: number;
  name: string; // scene name -- unused
  environmentURL: string; // environment file name -- must be a glb file located in the public/environments folder
 
  // Camera settings
  cameraPosition: [number, number, number]; // camera position in the scene
  cameraRotation: number; // camera rotation in the scene
  cameraPitch: number; // camera pitch in the scene
 
  // Environment settings
  environmentScale: [number, number, number]; // scale of the environment in the scene
  environmentPosition: [number, number, number]; // position of the environment in the scene
  environmentRotation: [number, number, number]; // rotation of the environment in the scene
 
  // Array of models instead of single model config
  models: Model[];
 
 }
 
 // Extend your existing NewStreamConfig interface
 export interface NewStreamConfig {
  id: number;
  title: string;
  agentId: string;
  twitter: string;
  modelName: string;
  description: string;
  identifier: string;
  color: string;
  type: string;
  component: string;
  bgm?: string | string[]; 
  creator: {
    avatar: string;
    title: string;
    username: string;
  };
  sceneConfigs: (SceneConfig)[];  
  stats: SceneStats;
  clothes: string;
 }

 export interface SceneStats {
  comments: number;

}

// Replace the hardcoded NEW_STREAM_CONFIGS with a function to load configs
export const loadStreamConfig = async (configId: string): Promise<NewStreamConfig> => {
  // This would fetch from your backend/database
  const config = await fetch(`${API_URL}/stream-configs/${configId}`);
  return config.json();
};

// Default values for new configurations
export const DEFAULT_STREAM_CONFIG = {
  environmentScale: [1, 1, 1],
  modelScale: [1, 1, 1],
  defaultCameraPosition: [2.86, 0.76, -7.73],
  defaultModelPosition: [1.51, -0.5, -7.65],
  defaultEnvironmentPosition: [3, -1, -3.5],
} as const;

// Function to update stream configs with real agent IDs
export const updateStreamConfigsWithAgentIds = (agentIds: {
  trump?: string;
  borp?: string;
  alpha?: string;
  beta?: string;
  gamma?: string;
}) => {
  NEW_STREAM_CONFIGS.forEach(config => {
    switch (config.identifier) {
      case 'trump':
        if (agentIds.trump) {
          config.agentId = agentIds.trump;
          config.sceneConfigs[0].models[0].agentId = agentIds.trump;
        }
        break;
      case 'borp':
        if (agentIds.borp) {
          config.agentId = agentIds.borp;
          config.sceneConfigs[0].models[0].agentId = agentIds.borp;
        }
        break;
      case 'alpha':
        if (agentIds.alpha) {
          config.agentId = agentIds.alpha;
          config.sceneConfigs[0].models[0].agentId = agentIds.alpha;
        }
        break;
      case 'beta':
        if (agentIds.beta) {
          config.agentId = agentIds.beta;
          config.sceneConfigs[0].models[0].agentId = agentIds.beta;
        }
        break;
      case 'gamma':
        if (agentIds.gamma) {
          config.agentId = agentIds.gamma;
          config.sceneConfigs[0].models[0].agentId = agentIds.gamma;
        }
        break;
    }
  });
  
  console.log('Updated stream configs with agent IDs:', agentIds);
};

// Function to get stream config by agent ID
export const getStreamConfigByAgentId = (agentId: string): NewStreamConfig | undefined => {
  return NEW_STREAM_CONFIGS.find(config => config.agentId === agentId);
};

// Function to get stream config by identifier
export const getStreamConfigByIdentifier = (identifier: string): NewStreamConfig | undefined => {
  return NEW_STREAM_CONFIGS.find(config => config.identifier === identifier);
};