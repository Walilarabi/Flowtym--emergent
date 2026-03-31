import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

interface RoomUpdate {
  hotelId: string;
  roomId: string;
  roomNumber: string;
  status?: string;
  cleaningStatus?: string;
  assignedTo?: string;
}

interface TaskUpdate {
  hotelId: string;
  taskId: string;
  roomNumber: string;
  status: string;
  assignedTo?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  namespace: '/housekeeping',
})
export class HousekeepingGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger = new Logger('HousekeepingGateway');
  private connectedClients = new Map<string, { hotelId: string; role: string }>();

  afterInit(server: Server) {
    this.logger.log('Housekeeping WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.connectedClients.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_hotel')
  handleJoinHotel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hotelId: string; role: string },
  ) {
    const roomName = `hotel_${data.hotelId}`;
    client.join(roomName);
    this.connectedClients.set(client.id, { hotelId: data.hotelId, role: data.role });
    this.logger.log(`Client ${client.id} joined ${roomName} as ${data.role}`);
    
    return { success: true, room: roomName };
  }

  @SubscribeMessage('leave_hotel')
  handleLeaveHotel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { hotelId: string },
  ) {
    const roomName = `hotel_${data.hotelId}`;
    client.leave(roomName);
    this.connectedClients.delete(client.id);
    this.logger.log(`Client ${client.id} left ${roomName}`);
    
    return { success: true };
  }

  // Emit room status update to all clients in hotel
  emitRoomUpdate(update: RoomUpdate) {
    const roomName = `hotel_${update.hotelId}`;
    this.server.to(roomName).emit('room_updated', update);
    this.logger.debug(`Room update emitted: ${update.roomNumber}`);
  }

  // Emit task status update
  emitTaskUpdate(update: TaskUpdate) {
    const roomName = `hotel_${update.hotelId}`;
    this.server.to(roomName).emit('task_updated', update);
    this.logger.debug(`Task update emitted: ${update.roomNumber}`);
  }

  // Emit inspection update
  emitInspectionUpdate(hotelId: string, inspection: any) {
    const roomName = `hotel_${hotelId}`;
    this.server.to(roomName).emit('inspection_updated', inspection);
  }

  // Emit assignment update
  emitAssignmentUpdate(hotelId: string, data: { staffId: string; rooms: string[] }) {
    const roomName = `hotel_${hotelId}`;
    this.server.to(roomName).emit('assignment_updated', data);
  }

  // Emit stats refresh signal
  emitStatsRefresh(hotelId: string) {
    const roomName = `hotel_${hotelId}`;
    this.server.to(roomName).emit('stats_refresh');
  }

  // Get connected clients count for a hotel
  getConnectedClientsCount(hotelId: string): number {
    let count = 0;
    this.connectedClients.forEach((value) => {
      if (value.hotelId === hotelId) count++;
    });
    return count;
  }
}
