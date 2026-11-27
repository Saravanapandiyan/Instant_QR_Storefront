import { io, type Socket } from 'socket.io-client';

let socketInstance: Socket | null = null;

export function getOwnerSocket(): Socket {
  if (!socketInstance) {
    socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socketInstance;
}
