import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  UpdateOrderStatusDto,
  UpdatePaymentStatusDto,
  UpdatePaymentSettingsDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // 1. Customer: Place new order (Cash payment)
  @Post()
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 8, windowMs: 60_000 })
  @ApiOperation({ summary: 'Place a new dine-in or takeaway order' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @Headers('x-storefront-token') storefrontToken?: string,
  ) {
    return this.ordersService.createOrder(dto, storefrontToken);
  }

  // 2. TV Order Ready Board: Wall displays & pickup screens
  @Get('tv-board/:targetId')
  @ApiOperation({ summary: 'Get active cooking and ready orders for TV Order Ready Board' })
  async getTvBoardOrders(@Param('targetId') targetId: string) {
    return this.ordersService.getTvBoardOrders(targetId);
  }

  // 3. Customer: Live order status tracking
  @Get(':id')
  @UseGuards(RateLimitGuard)
  @RateLimit({ limit: 60, windowMs: 60_000 })
  @ApiOperation({ summary: 'Get order details and status for tracking' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  // 3. Owner: Get all orders for restaurant with status/branch/date filters
  @Get('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get live orders list for restaurant owner' })
  async getOwnerOrders(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query('status') status?: string,
    @Query('branchId') branchId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.ordersService.getOwnerOrders(restaurantId, user.id, {
      status,
      branchId,
      startDate,
      endDate,
    });
  }

  // 4. Owner: Update order status (Confirm, Prep, Ready, Complete, Cancel)
  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status or cancel order' })
  async updateOrderStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, user.id, dto);
  }

  // 5. Owner: Update payment status (e.g. mark Cash as Paid)
  @Patch(':id/payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment status for order' })
  async updatePaymentStatus(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdatePaymentStatusDto,
  ) {
    return this.ordersService.updatePaymentStatus(id, user.id, dto);
  }

  // 6. Owner: Get payment settings
  @Get('restaurant/:restaurantId/payment-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment configuration for restaurant' })
  async getPaymentSettings(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.getPaymentSettings(restaurantId, user.id);
  }

  // 7. Owner: Update payment settings (Cash toggle)
  @Patch('restaurant/:restaurantId/payment-settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update payment and tax/GST settings' })
  async updatePaymentSettings(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Body() dto: UpdatePaymentSettingsDto,
  ) {
    return this.ordersService.updatePaymentSettings(
      restaurantId,
      user.id,
      dto,
    );
  }
}

