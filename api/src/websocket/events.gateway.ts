import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true,
  },
  namespace: '/',
})
export class EventsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  afterInit() {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  emitUserPendingCreated(user: any) {
    this.server?.emit('user.pending.created', { user, timestamp: new Date() });
  }

  emitUserApproved(user: any) {
    this.server?.emit('user.approved', { user, timestamp: new Date() });
  }

  emitUserRejected(user: any) {
    this.server?.emit('user.rejected', { user, timestamp: new Date() });
  }

  emitIncidentCreated(incident: any) {
    this.server?.emit('incident.created', { incident, timestamp: new Date() });
  }

  emitIncidentClosed(incident: any) {
    this.server?.emit('incident.closed', { incident, timestamp: new Date() });
  }

  emitNotificationUpdated(notification: any) {
    this.server?.emit('notification.updated', { notification, timestamp: new Date() });
  }
}
