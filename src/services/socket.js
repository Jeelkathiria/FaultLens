import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env?.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export function getSocket() {
  if (!socket) {
    const token = localStorage.getItem('faultlens_token');
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('⚡ Connected to FaultLens real-time WebSocket server');
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from FaultLens WebSocket server:', reason);
    });
  }

  return socket;
}

export function subscribeToWebsite(websiteId) {
  const s = getSocket();
  if (s) s.emit('subscribe:website', websiteId);
}

export function unsubscribeFromWebsite(websiteId) {
  const s = getSocket();
  if (s) s.emit('unsubscribe:website', websiteId);
}

export function subscribeToApi(apiId) {
  const s = getSocket();
  if (s) s.emit('subscribe:api', apiId);
}

export function unsubscribeFromApi(apiId) {
  const s = getSocket();
  if (s) s.emit('unsubscribe:api', apiId);
}
