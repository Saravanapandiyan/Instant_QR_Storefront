import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { StaffService } from './staff.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('staff')
@Controller('staff')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get('restaurant/:restaurantId')
  @ApiOperation({ summary: 'List all staff members for a restaurant brand' })
  findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    return this.staffService.findByRestaurant(restaurantId, user?.id || user);
  }

  @Post('restaurant/:restaurantId')
  @ApiOperation({ summary: 'Create or invite a new staff member' })
  create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateStaffDto,
    @CurrentUser() user: any,
  ) {
    return this.staffService.create(restaurantId, dto, user?.id || user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update staff member details, role, branches or permissions' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateStaffDto,
    @CurrentUser() user: any,
  ) {
    return this.staffService.update(id, dto, user?.id || user);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Toggle staff active/inactive status' })
  toggleActive(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.staffService.toggleActive(id, user?.id || user);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a staff member from the restaurant' })
  remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.staffService.remove(id, user?.id || user);
  }
}

