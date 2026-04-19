import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const BASE_RECONNECT_DELAY = 1000;

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    // Initialize socket connection
    const socketInitializer = async () => {
      try {
        // We just call it because we don't need anything else out of it
        await fetch('/api/socketio').catch(err => {
          console.warn('Fetch request to socketio endpoint failed:', err);
        });

        if (!isMountedRef.current) return;

        socket = io(undefined, {
          path: '/api/socketio',
          reconnection: true,
          reconnectionDelay: BASE_RECONNECT_DELAY,
          reconnectionDelayMax: 10000,
          reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
          randomizationFactor: 0.1,
          // Add timeout for connection
          timeout: 20000
        });

        socket.on('connect', () => {
          if (!isMountedRef.current) return;
          console.log('✅ Connected to Socket.IO server');
          reconnectAttempts = 0;
          setIsConnected(true);
        });

        socket.on('disconnect', (reason) => {
          if (!isMountedRef.current) return;
          console.log('❌ Disconnected from Socket.IO server:', reason);
          setIsConnected(false);
        });
        
        socket.on('connect_error', (error) => {
          if (!isMountedRef.current) return;
          console.error('⚠️ Socket connection error:', error);
        });

        socket.on('error', (error) => {
          if (!isMountedRef.current) return;
          console.error('⚠️ Socket error:', error);
        });
      } catch (error) {
        console.error('Error initializing socket:', error);
      }
    };

    socketInitializer();

    return () => {
      isMountedRef.current = false;
      if (socket) {
        try {
          reconnectAttempts = 0;
          socket.disconnect();
        } catch (err) {
          console.warn('Error disconnecting socket:', err);
        }
      }
    };
  }, []);

  return { socket, isConnected };
};

export { socket };
