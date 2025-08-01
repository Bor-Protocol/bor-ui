import { createContext, useContext, useState, ReactNode, useEffect, useMemo, useCallback } from 'react';
import { SceneConfig } from '../utils/constants.js';

import { useSocket } from '../hooks/useSocket';
import axios from 'axios';
import { API_URL, NEW_STREAM_CONFIGS, NewStreamConfig } from '../utils/constants';
//import { useSceneManager } from '../hooks/useSceneManager';
// import Splash from '../components/Splash';

interface Comment {
  id: string;
  agentId: string;
  user: string;
  message: string;
  createdAt: string;
  avatar: string;
  handle: string;
  __v: number;
  _id: string;
  messageType?: 'regular' | 'system';
  metadata?: {
    txHash?: string;
    icon?: string;
  };
}



export interface SceneStats {
  comments: number;
 
}

interface SceneContextType {
  currentAgentId: string;
  nextAgentId: string;
  prevAgentId: string;
  scenes: NewStreamConfig[]; // TODO: moving off this
  newScenes: NewStreamConfig[];
  setCurrentAgentId: (agentId: string) => void;
  updateSceneStats: (agentId: string, key: keyof SceneStats) => void;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  setCommentCount: (commentCount: number) => void;
  commentCount: number;
  addComment: (message: string,avatar?: string,handle?: string, isSystem?: boolean, emitToServer?: boolean) => void;
  currentSceneIndex: number;
  nextSceneIndex: number;
  prevSceneIndex: number;
  activeScene: number;
  setCurrentSceneIndex: (index: number) => void;
  setActiveScene: (scene: number) => void;
  //isLoading: boolean;
  //error: Error | null;
  //refreshScenes: () => Promise<void>;

  sceneConfigIndex: number;
  setSceneConfigIndex: (index: number) => void;
  swapSceneConfig: (index: number) => void;
  cycleSceneConfig: () => void;
  swapSceneConfigByClothes: (clothesName: string) => void;
  availableSceneConfigs: SceneConfig[];
  availableClothes: string[];
  updateScene: (updatedScene: NewStreamConfig) => void;
}

const SceneContext = createContext<SceneContextType | undefined>(undefined);

const FAKE_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=32&h=32&fit=crop',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=32&h=32&fit=crop'
];




export function SceneProvider({ children }: { children: ReactNode }) {
  //get scenes config
  //refreshScenes is removed for now but can be added back in to ensure the refresh after we change config
  //const { isLoading, error } = useSceneManager();

  const [newScenes, setNewScenes] = useState<NewStreamConfig[]>(NEW_STREAM_CONFIGS);

  const { emit, socket } = useSocket();
  const [userId] = useState<string>("Anonymous");


  const [currentAgentId, setCurrentAgentId] = useState(newScenes[0]?.agentId || '');

  // Comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(0)

  

  // Helper function to get scene indices
  const getCurrentSceneIndex = useCallback(() =>
    newScenes.findIndex(newScene => newScene.agentId === currentAgentId),
    [newScenes, currentAgentId]
  );

  const nextAgentId = useMemo(() =>
    newScenes[(getCurrentSceneIndex() + 1) % newScenes.length].agentId,
    [newScenes, getCurrentSceneIndex]
  );

  const prevAgentId = useMemo(() =>
    newScenes[(getCurrentSceneIndex() - 1 + newScenes.length) % newScenes.length].agentId,
    [newScenes, getCurrentSceneIndex]
  );

  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [activeScene, setActiveScene] = useState<number>(0);

  // Scene configs (clothes etc)
  const [sceneConfigIndex, setSceneConfigIndex] = useState(0);

  const swapSceneConfig = (index: number) => {
    setSceneConfigIndex(index);
  }

  const availableSceneConfigs = useMemo(() => newScenes[currentSceneIndex]?.sceneConfigs || [], [newScenes, currentSceneIndex]);
  const availableClothes = useMemo(() => availableSceneConfigs.map(sceneConfig => sceneConfig.models[0]?.clothes || ''), [availableSceneConfigs]);
  // console.log({ availableSceneConfigs, availableClothes })

  const cycleSceneConfig = useCallback(() => {
    // console.log('cycling scene config', availableSceneConfigs.length)
    setSceneConfigIndex(prevIndex => (prevIndex + 1) % availableSceneConfigs.length);
  }, [availableSceneConfigs.length]);
  

  const swapSceneConfigByClothes = useCallback((clothesName: string) => {
    const targetIndex = availableSceneConfigs.findIndex(
      config => config.models[0]?.clothes === clothesName
    );
    if (targetIndex !== -1) {
      setSceneConfigIndex(targetIndex);
    }
  }, [availableSceneConfigs]);

  const [, setSceneStats] = useState<SceneStats[]>(() =>
    newScenes.map(scene => ({ ...scene.stats }))
  );

  // Scene mgmt
  const nextSceneIndex = (currentSceneIndex + 1) % newScenes.length;
  const prevSceneIndex = (currentSceneIndex - 1 + newScenes.length) % newScenes.length;



  // Update currentAgentId when scenes change
  useEffect(() => {
    if (newScenes.length > 0) {
      const currentScene = newScenes[currentSceneIndex];
      // console.log('setting current agent id to', currentScene.agentId);
      setCurrentAgentId(currentScene.agentId);
      
      // Update URL with scene identifier
    }
  }, [newScenes, currentSceneIndex]);


  // Initial scene stats
  useEffect(() => {
    const fetchSceneStats = async () => {
      try {
        const res = await axios.get(`${API_URL}/api/streams/${currentAgentId}/stats`);
        // console.log(`Scene stats for ${currentAgentId}:`, res.data);
        setCommentCount(res.data.comments || []);
      } catch (error) {
        console.error(`Failed to fetch scene stats for ${currentAgentId}:`, error);
      }
    };

    fetchSceneStats();

    if (socket) {
      socket.emit('join_agent_stream', currentAgentId);
    }

  }, [currentAgentId, socket]);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;

    // Create a single handler function
    const handleCommentReceived = (data: { commentCount: number, newComment: Comment }) => {
      console.log("comment received for agent:", currentAgentId, data);
      setCommentCount(data.commentCount);

      // Don't skip any messages - show all real-time updates
      const comment: Comment = {
        id: data.newComment.id.toString(),
        agentId: data.newComment.agentId,
        user: data.newComment.user,
        message: data.newComment.message,
        createdAt: data.newComment.createdAt,
        avatar: data.newComment.avatar,
        handle: data.newComment.handle,
        __v: 0,  // Add this
        _id: data.newComment.id.toString()  // Add this

      };

      setComments(prev => {
        // Check if comment already exists to avoid duplicates
        const exists = prev.some(c => c.id === comment.id);
        if (exists) {
          console.log('Comment already exists, skipping');
          return prev;
        }
        const updated = [...prev, comment].slice(-100);
        console.log('Comments updated:', updated.length, 'comments');
        return updated;
      });
    };

    // Remove any existing listeners before adding new ones
    socket.off(`${currentAgentId}_comment_received`);

    // Add new listeners
    socket.on(`${currentAgentId}_comment_received`, handleCommentReceived);


    return () => {
      socket.off(`${currentAgentId}_comment_received`);
    };
  }, [socket, currentAgentId, userId]);

  // Unused
  const updateSceneStats = (agentId: string, key: keyof SceneStats) => {
    setSceneStats(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      const agentIndex = newScenes.findIndex(scene => scene.agentId === agentId);
      if (agentIndex === -1) return prevArray;
      
      const newArray = [...prevArray];
      newArray[agentIndex] = {
        ...newArray[agentIndex],
        [key]: (newArray[agentIndex]?.[key] || 0) + 1
      };
      return newArray;
    });
  };

  // Comments
  const addComment = useCallback((
    message: string,
    avatar?: string,
    handle?: string,
    isSystem: boolean = false,
    emitToServer: boolean = true,
    messageType: 'regular' | 'system' = 'regular',
   
    metadata?: {
      txHash?: string; 
      icon?: string;
    }
  ) => {
    const randomAvatar = FAKE_AVATARS[Math.floor(Math.random() * FAKE_AVATARS.length)];

    const newComment: Comment = {
      id: Date.now().toString(),
      agentId: currentAgentId,
      user: userId ? userId : isSystem ? 'System' : '',
      message,
      avatar: avatar ?? randomAvatar,
      handle: handle ?? 'Anonymous',
      createdAt: new Date().toISOString(),
      __v: 0,
      _id: Date.now().toString(),
      messageType,
      metadata
    };

    setComments(prev => [...prev, newComment]);

    if (emitToServer) {
      emit(`new_comment`, { comment: newComment, agentId: currentAgentId });
    }
  }, [currentAgentId, userId, emit]);



  // Update scene memo with safety check
  const scene = useMemo(() =>
    newScenes[currentSceneIndex] || null,
    [newScenes, currentSceneIndex]
  );

  // On scene change
  useEffect(() => {
    if (scene) {
      // console.log('new scene', scene);
      setComments([]);

      // Fetch comments for the new scene
      const fetchComments = async () => {
        try {
          const url = `${API_URL}/api/agents/${currentAgentId}/chat-history?limit=15`;
          // console.log('fetching comments from', url);
          const res = await axios.get(url);
          // Reverse the array to get the latest comments first   
          const reversedComments = res.data.chatHistory.reverse();
          // console.log({ comments: reversedComments })
          setComments(reversedComments);
        } catch (error) {
          console.error(`Failed to fetch comments for ${currentAgentId}:`, error);
        }
      };

     
      fetchComments();
    }
  }, [scene, currentAgentId]);

  const updateScene = (updatedScene: NewStreamConfig) => {
    setNewScenes(prev => prev.map(scene => 
      scene.id === updatedScene.id ? updatedScene : scene
    ));
  };

  return (
    <SceneContext.Provider
      value={{
        currentAgentId,
        nextAgentId,
        prevAgentId,
        
        scenes: newScenes,
        setCurrentAgentId,
        updateSceneStats,
        newScenes,

        // Comments
        comments,
        commentCount,
        setCommentCount,
        addComment,
        setComments,

        

        // Scene Context
        currentSceneIndex,
        nextSceneIndex,
        prevSceneIndex,
        activeScene,
        setCurrentSceneIndex,
        setActiveScene,

        // New properties
       // isLoading,
       // error,
        //refreshScenes,


        sceneConfigIndex,
        setSceneConfigIndex,
        swapSceneConfig,
        cycleSceneConfig,
        swapSceneConfigByClothes,
        availableSceneConfigs,
        availableClothes,
        updateScene,
      }}
    >
      {children}
    </SceneContext.Provider>
  );
}

export function useScene() {
  const context = useContext(SceneContext);
  if (!context) {
    throw new Error('useScene must be used within a SceneProvider');
  }
  return context;
}
