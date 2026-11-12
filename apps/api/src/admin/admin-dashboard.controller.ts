import { Controller, Get, UseGuards } from '@nestjs/common';
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
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden (Requires SUPER_ADMIN role)' })
  getStats() {
    return this.dashboardService.getDashboardStats();
  }

  @Get('velocity')
  @ApiOperation({ summary: 'Get 30-day order and GMV velocity telemetry' })
  @ApiResponse({ status: 200, description: 'Timeline points for charting.' })
  getVelocity() {
    return this.dashboardService.getDashboardVelocity();
  }

  @Get('recent-fleet')
  @ApiOperation({ summary: 'Get recently onboarded restaurant tenants and fleet size' })
  @ApiResponse({ status: 200, description: 'List of recent restaurant fleets.' })
  getRecentFleet() {
    return this.dashboardService.getRecentFleet();
  }
}

