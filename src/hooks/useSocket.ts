import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { SOCKET_EVENTS } from '../utils/socketEvents';

let socketInstance: Socket | null = null; // Single socket instance outside the hook

export const useSocket = (authToken?: string) => {
  const [peerCount, setPeerCount] = useState(0);
  const [isServerOnline, setIsServerOnline] = useState(false); // Start as false until connected
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    // Always recreate socket when authToken changes
    if (socketInstance) {
      socketInstance.disconnect();
    }
    
    socketInstance = io(SOCKET_URL, {
      reconnectionDelay: 1000,
      reconnection: true,
      reconnectionAttempts: 10,
      transports: ['websocket'],
      agent: false,
      upgrade: false,
      rejectUnauthorized: false,
      auth: {
        token: authToken // Pass JWT token for authentication
      }
    });

    const socket = socketInstance;
    
    // Make socket globally available
    (window as any).socket = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to bor-server');
      setIsServerOnline(true);
      socket.emit('request_peer_count');
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from bor-server');
      setIsServerOnline(false);
      setIsAuthenticated(false);
      setAuthenticatedUser(null);
    });

    socket.on('initial_state', (data: { 
      peerCount: number; 
      commentCount?: number;
      authenticated: boolean; 
      user: { id: string; email: string } | null;
    }) => {
      console.log('ℹ️ Initial state received:', data);
      setPeerCount(data.peerCount);
      setIsAuthenticated(data.authenticated);
      setAuthenticatedUser(data.user);
    });

    socket.on('peer_count', (data: { count: number }) => {
      console.log('὆4 Peer count updated:', data.count);
      setPeerCount(data.count);
    });

    // Handle authentication errors
    socket.on('comment_error', (error: { success: boolean; error: string }) => {
      console.error('Comment error:', error.error);
    });

    socket.on('stream_join_error', (error: { success: boolean; error: string }) => {
      console.error('Stream join error:', error.error);
    });

    socket.on('stream_joined', (data: { agentId: string; authenticated: boolean }) => {
      console.log(`Successfully joined stream ${data.agentId} (authenticated: ${data.authenticated})`);
    });

    return () => {
      // Clean up event listeners
      socket.off('connect');
      socket.off('disconnect');
      socket.off('initial_state');
      socket.off('peer_count');
      socket.off('comment_error');
      socket.off('stream_join_error');
      socket.off('stream_joined');
    };
  }, [authToken]);

  return {
    socket: socketInstance,
    peerCount,
    isServerOnline,
    isAuthenticated,
    authenticatedUser,
    emit: (event: string, data: any) => socketInstance?.emit(event, data)
  };
};

