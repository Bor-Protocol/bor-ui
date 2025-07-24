import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '../utils/constants';
import { SOCKET_EVENTS } from '../utils/socketEvents';

let socketInstance: Socket | null = null; // Single socket instance outside the hook

export const useSocket = (authToken?: string) => {
  const [peerCount, setPeerCount] = useState(0);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authenticatedUser, setAuthenticatedUser] = useState<{ id: string; email: string } | null>(null);

  useEffect(() => {
    if (!socketInstance) {
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
    }

    const socket = socketInstance;

    socket.on(SOCKET_EVENTS.CONNECTION, () => {
      // console.log('Connected to server');
      setIsServerOnline(true);
      socket.emit(SOCKET_EVENTS.REQUEST_PEER_COUNT);
    });

    socket.on(SOCKET_EVENTS.INITIAL_STATE, (data: { 
      peerCount: number; 
      authenticated: boolean; 
      user: { id: string; email: string } | null;
    }) => {
      setPeerCount(data.peerCount);
      setIsAuthenticated(data.authenticated);
      setAuthenticatedUser(data.user);
    });

    socket.on(SOCKET_EVENTS.PEER_COUNT, (data: { count: number }) => {
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
      // Don't disconnect on cleanup, just remove listeners
      socket.off(SOCKET_EVENTS.CONNECTION);
      socket.off(SOCKET_EVENTS.INITIAL_STATE);
      socket.off(SOCKET_EVENTS.PEER_COUNT);
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

