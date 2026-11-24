import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('admin-dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/dashboard')
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get aggregated platform statistics for Admin Dashboard' })
  @ApiResponse({ status: 200, description: 'Platform counts and growth metrics.' })
  getStats(
    @Query('restaurantId') restaurantId?: string,
    @Query('branchId') branchId?: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getDashboardStats(
      restaurantId,
      branchId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('velocity')
  @ApiOperation({ summary: 'Get order and GMV velocity telemetry for date range' })
  @ApiResponse({ status: 200, description: 'Timeline points for charting.' })
  getVelocity(
    @Query('restaurantId') restaurantId?: string,
    @Query('branchId') branchId?: string,
    @Query('days') days?: string,
  ) {
    return this.dashboardService.getDashboardVelocity(
      restaurantId,
      branchId,
      days ? parseInt(days, 10) : 30,
    );
  }

  @Get('recent-fleet')
  @ApiOperation({ summary: 'Get recently onboarded restaurant tenants and fleet size' })
  @ApiResponse({ status: 200, description: 'List of recent restaurant fleets.' })
  getRecentFleet(@Query('restaurantId') restaurantId?: string) {
    return this.dashboardService.getRecentFleet(restaurantId);
  }
}
