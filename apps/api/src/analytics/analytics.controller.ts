import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Analytics & Reports')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get aggregated sales analytics, hourly peak distribution, and top dishes' })
  async getRestaurantAnalytics(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
    @Query('branchId') branchId?: string,
    @Query('period') period?: 'today' | '7d' | '30d' | 'all',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getRestaurantAnalytics(restaurantId, user.id, {
      branchId,
      period,
      startDate,
      endDate,
    });
  }
}
