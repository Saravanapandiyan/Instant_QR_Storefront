"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let OrdersGateway = class OrdersGateway {
    server;
    extractId(payload, key) {
        if (typeof payload === 'string')
            return payload.trim() || null;
        if (payload && typeof payload[key] === 'string')
            return payload[key].trim() || null;
        return null;
    }
    handleJoinOrder(client, payload) {
        const orderId = this.extractId(payload, 'orderId');
        if (orderId) {
            void client.join(`order:${orderId}`);
        }
    }
    handleLeaveOrder(client, payload) {
        const orderId = this.extractId(payload, 'orderId');
        if (orderId) {
            void client.leave(`order:${orderId}`);
        }
    }
    handleJoinRestaurant(client, payload) {
        const restaurantId = this.extractId(payload, 'restaurantId');
        if (restaurantId) {
            void client.join(`restaurant:${restaurantId}`);
        }
    }
    handleLeaveRestaurant(client, payload) {
        const restaurantId = this.extractId(payload, 'restaurantId');
        if (restaurantId) {
            void client.leave(`restaurant:${restaurantId}`);
        }
    }
    handleJoinBranch(client, payload) {
        const branchId = this.extractId(payload, 'branchId');
        if (branchId) {
            void client.join(`branch:${branchId}`);
        }
    }
    handleLeaveBranch(client, payload) {
        const branchId = this.extractId(payload, 'branchId');
        if (branchId) {
            void client.leave(`branch:${branchId}`);
        }
    }
    emitOrderCreated(order) {
        if (!this.server || !order)
            return;
        if (order.restaurantId) {
            this.server.to(`restaurant:${order.restaurantId}`).emit('order:created', order);
        }
        if (order.branchId) {
            this.server.to(`branch:${order.branchId}`).emit('order:created', order);
        }
    }
    emitOrderUpdated(order) {
        if (!this.server || !order)
            return;
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
};
exports.OrdersGateway = OrdersGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], OrdersGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:order'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleJoinOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:order'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleLeaveOrder", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:restaurant'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleJoinRestaurant", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:restaurant'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleLeaveRestaurant", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('join:branch'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleJoinBranch", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('leave:branch'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], OrdersGateway.prototype, "handleLeaveBranch", null);
exports.OrdersGateway = OrdersGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: true,
            credentials: true,
        },
        transports: ['websocket', 'polling'],
    })
], OrdersGateway);
//# sourceMappingURL=orders.gateway.js.map