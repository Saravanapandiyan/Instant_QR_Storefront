import { Server, Socket } from 'socket.io';
export declare class OrdersGateway {
    server: Server;
    private extractId;
    handleJoinOrder(client: Socket, payload: string | {
        orderId?: string;
    }): void;
    handleLeaveOrder(client: Socket, payload: string | {
        orderId?: string;
    }): void;
    handleJoinRestaurant(client: Socket, payload: string | {
        restaurantId?: string;
    }): void;
    handleLeaveRestaurant(client: Socket, payload: string | {
        restaurantId?: string;
    }): void;
    handleJoinBranch(client: Socket, payload: string | {
        branchId?: string;
    }): void;
    handleLeaveBranch(client: Socket, payload: string | {
        branchId?: string;
    }): void;
    emitOrderCreated(order: any): void;
    emitOrderUpdated(order: any): void;
}
