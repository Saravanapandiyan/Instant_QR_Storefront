import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import {
  AdminOrdersService,
  AdminOrdersQuery,
  UpdateAdminOrderStatusDto,
} from './admin-orders.service';

@ApiTags('admin-orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/orders')
export class AdminOrdersController {
  constructor(private readonly ordersService: AdminOrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Super Admin: Global real-time orders feed with scoping and filters' })
  @ApiResponse({ status: 200, description: 'List of live orders with real-time status.' })
  getOrders(@Query() query: AdminOrdersQuery) {
    return this.ordersService.getOrders(query);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Super Admin: Update live order status' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() body: UpdateAdminOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, body.status);
  }
}
