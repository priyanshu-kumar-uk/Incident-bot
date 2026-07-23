import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('WebSocket connected:', socket.id);
    });

    socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    socket.on('user.pending.created', (data) => {
      queryClient.invalidateQueries({ queryKey: ['users', 'pending'] });
      toast.info(`New user registration: ${data.user?.email}`);
    });

    socket.on('user.approved', (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User approved: ${data.user?.email}`);
    });

    socket.on('user.rejected', (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.error(`User rejected: ${data.user?.email}`);
    });

    socket.on('incident.created', (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.warning(`New incident: ${data.incident?.title}`);
    });

    socket.on('incident.closed', (data) => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      toast.success(`Incident closed: ${data.incident?.title}`);
    });

    socket.on('notification.updated', () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return socketRef.current;
}
