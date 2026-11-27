import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
  transports: ['websocket', 'polling'],
})
export class OrdersGateway {
  @WebSocketServer()
  server!: Server;

  private extractId(payload: string | Record<string, any>, key: string): string | null {
    if (typeof payload === 'string') return payload.trim() || null;
    if (payload && typeof payload[key] === 'string') return payload[key].trim() || null;
    return null;
  }

  @SubscribeMessage('join:order')
  handleJoinOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string | { orderId?: string },
  ) {
    const orderId = this.extractId(payload, 'orderId');
    if (orderId) {
      void client.join(`order:${orderId}`);
    }
  }

  @SubscribeMessage('leave:order')
  handleLeaveOrder(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string | { orderId?: string },
  ) {
    const orderId = this.extractId(payload, 'orderId');
    if (orderId) {
      void client.leave(`order:${orderId}`);
    }
  }

  @SubscribeMessage('join:restaurant')
  handleJoinRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string | { restaurantId?: string },
  ) {
    const restaurantId = this.extractId(payload, 'restaurantId');
    if (restaurantId) {
      void client.join(`restaurant:${restaurantId}`);
    }
  }

  @SubscribeMessage('leave:restaurant')
  handleLeaveRestaurant(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string | { restaurantId?: string },
  ) {
    const restaurantId = this.extractId(payload, 'restaurantId');
    if (restaurantId) {
      void client.leave(`restaurant:${restaurantId}`);
    }
  }

  @SubscribeMessage('join:branch')
  handleJoinBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string | { branchId?: string },
  ) {
    const branchId = this.extractId(payload, 'branchId');
    if (branchId) {
      void client.join(`branch:${branchId}`);
    }
  }

  @SubscribeMessage('leave:branch')
  handleLeaveBranch(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: string | { branchId?: string },
  ) {
    const branchId = this.extractId(payload, 'branchId');
    if (branchId) {
      void client.leave(`branch:${branchId}`);
    }
  }

  emitOrderCreated(order: any) {
    if (!this.server || !order) return;
    if (order.restaurantId) {
      this.server.to(`restaurant:${order.restaurantId}`).emit('order:created', order);
    }
    if (order.branchId) {
      this.server.to(`branch:${order.branchId}`).emit('order:created', order);
    }
  }

  emitOrderUpdated(order: any) {
    if (!this.server || !order) return;
    if (order.id) {
      this.server.to(`order:${order.id}`).emit('order:updated', order);
    }
    if (order.restaurantId) {
      this.server.to(`restaurant:${order.restaurantId}`).emit('order:updated', order);
    }
    if (order.branchId) {
      this.server.to(`branch:${order.branchId}`).emit('order:updated', order);
    }
  }
}
