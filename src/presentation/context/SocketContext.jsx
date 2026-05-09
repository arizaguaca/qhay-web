import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext();

/**
 * SocketProvider — Manages the real-time connection with the backend.
 * Provides the socket instance, connection status, and a helper to trigger notifications.
 */
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [shouldConnect, setShouldConnect] = useState(false); // Controls the UI indicator
  const currentRestaurantId = useRef(null);
  const audioRef = useRef(new Audio('/sound/notification.mp3'));

  useEffect(() => {
    // Determine Backend URL (fallback to localhost if not specified)
    const fullUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    // IMPORTANT: Socket.io treats any path after the domain as a Namespace.
    // If VITE_API_URL is 'http://localhost:8080/api/v1', we must use only 'http://localhost:8080'
    // otherwise it fails with "Invalid namespace".
    const baseUrl = new URL(fullUrl).origin;

    console.log('📡 [Socket] Connecting to server root:', baseUrl);

    const socketInstance = io(baseUrl, {
      transports: ['polling', 'websocket'],
      autoConnect: false,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
      console.log('🚀 [Socket] Connected to server ID:', socketInstance.id);
      
      // Auto-rejoin restaurant room on every connect/reconnect
      if (currentRestaurantId.current) {
        console.log('📡 [Socket] Auto-rejoining room:', currentRestaurantId.current);
        socketInstance.emit('join_restaurant', currentRestaurantId.current);
      }
    });

    socketInstance.on('disconnect', (reason) => {
      setIsConnected(false);
      console.log('❌ [Socket] Disconnected:', reason);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('⚠️ [Socket] Connection error:', error.message);
      setIsConnected(false);
      // Si el error es por falta de restaurantId, lo veremos aquí
    });

    setSocket(socketInstance);

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  /**
   * connect — Establishes or updates the connection with a specific restaurantId
   * @param {string} restaurantId 
   */
  const connect = useCallback((restaurantId) => {
    if (!socket || !restaurantId) return;

    setShouldConnect(true);

    // If already connected to this restaurant, skip
    if (socket.connected && currentRestaurantId.current === restaurantId) return;

    console.log(`🔗 [Socket] Attempting connection for Restaurant: ${restaurantId}`);

    socket.auth = { restaurantId };
    socket.io.opts.query = { restaurantId };

    currentRestaurantId.current = restaurantId;

    if (socket.connected) {
      socket.disconnect();
    }
    socket.connect();
  }, [socket]);

  /**
   * disconnect — Manually stop the socket connection and hide indicators
   */
  const disconnect = useCallback(() => {
    if (socket) {
      socket.disconnect();
      setShouldConnect(false);
      setIsConnected(false);
      currentRestaurantId.current = null;
      console.log('🔌 [Socket] Connection stopped manually');
    }
  }, [socket]);

  /**
   * notify — Unified helper for sound and visual feedback
   */
  const notify = useCallback((title, options = {}) => {
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(err => console.warn('Audio playback blocked:', err));

    if (document.hidden && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        ...options,
      });
    }
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, notify, connect, disconnect }}>
      {children}

      {/* Visual Reconnection Indicator — Only show if we SHOULD be connected */}
      {shouldConnect && !isConnected && (
        <div style={{
          position: 'fixed', bottom: '20px', left: '20px', zIndex: 10000,
          background: 'rgba(239, 68, 68, 0.9)', color: 'white',
          padding: '0.6rem 1.2rem', borderRadius: '12px', fontSize: '0.85rem',
          fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.8rem',
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.1)',
          animation: 'slideIn 0.3s ease-out'
        }}>
          <div className="socket-dot" />
          Reconectando tiempo real...
        </div>
      )}

      <style>{`
        .socket-dot {
          width: 10px; height: 10px; border-radius: 50%;
          background: white; animation: socket-pulse 1.5s infinite;
        }
        @keyframes socket-pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 255, 255, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0); }
        }
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within a SocketProvider');
  return context;
};
