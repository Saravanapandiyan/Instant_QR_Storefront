import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AdminRestaurantsService, AdminRestaurantsQuery } from './admin-restaurants.service';

@ApiTags('admin-restaurants')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/restaurants')
export class AdminRestaurantsController {
  constructor(private readonly restaurantsService: AdminRestaurantsService) {}

  @Get()
  @ApiOperation({ summary: 'List all restaurant tenants with status filters and search' })
  @ApiResponse({ status: 200, description: 'Filtered list of restaurants with counts.' })
  getRestaurants(@Query() query: AdminRestaurantsQuery) {
    return this.restaurantsService.getRestaurants(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full profile of a restaurant for deep inspection' })
  @ApiResponse({ status: 200, description: 'Full tenant details with branches and catalog counts.' })
  @ApiResponse({ status: 404, description: 'Restaurant not found.' })
  getRestaurantById(@Param('id') id: string) {
    return this.restaurantsService.getRestaurantById(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Suspend or reactivate a restaurant tenant' })
  @ApiResponse({ status: 200, description: 'Updated operational status.' })
  updateRestaurantStatus(
    @Param('id') id: string,
    @Body() body: { isActive: boolean },
  ) {
    return this.restaurantsService.updateRestaurantStatus(id, body.isActive);
  }

  @Post(':id/credits/adjust')
  @ApiOperation({ summary: 'Super Admin: Manually adjust restaurant credits (+/-)' })
  adjustRestaurantCredits(
    @Param('id') id: string,
    @Body() body: { delta: number; reason: string; notes?: string },
    @Request() req: any,
  ) {
    return this.restaurantsService.adjustRestaurantCredits(
      id,
      body.delta,
      body.reason,
      body.notes,
      req.user.id,
    );
  }

  @Post(':id/impersonate')
  @ApiOperation({ summary: 'Super Admin: Impersonate restaurant owner' })
  impersonateRestaurant(@Param('id') id: string) {
    return this.restaurantsService.impersonateRestaurant(id);
  }
}

