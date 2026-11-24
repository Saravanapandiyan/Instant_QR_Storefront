import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import {
  AdminDishesService,
  AdminDishesQuery,
  CreateAdminDishDto,
  UpdateAdminDishDto,
} from './admin-dishes.service';

@ApiTags('admin-dishes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/dishes')
export class AdminDishesController {
  constructor(private readonly dishesService: AdminDishesService) {}

  @Get()
  @ApiOperation({ summary: 'List all menu dishes with restaurant, branch and category filtering' })
  @ApiResponse({ status: 200, description: 'Filtered list of master catalog dishes.' })
  getDishes(@Query() query: AdminDishesQuery) {
    return this.dishesService.getDishes(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full dish detail' })
  getDishById(@Param('id') id: string) {
    return this.dishesService.getDishById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Super Admin: Create a new dish in catalog' })
  createDish(@Body() body: CreateAdminDishDto) {
    return this.dishesService.createDish(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Super Admin: Update dish details' })
  updateDish(@Param('id') id: string, @Body() body: UpdateAdminDishDto) {
    return this.dishesService.updateDish(id, body);
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Super Admin: Toggle in-stock / sold-out state' })
  toggleStock(
    @Param('id') id: string,
    @Body() body: { inStock: boolean; branchId?: string },
  ) {
    return this.dishesService.toggleStock(id, body.inStock, body.branchId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Super Admin: Archive dish from catalog' })
  deleteDish(@Param('id') id: string, @Request() req: any) {
    return this.dishesService.deleteDish(id, req.user?.id);
  }
}
