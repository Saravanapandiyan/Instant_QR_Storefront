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
  AdminUsersService,
  AdminUsersQuery,
  CreateAdminUserDto,
  UpdateAdminUserDto,
  UpdateUserRoleDto,
  UpdateUserStatusDto,
} from './admin-users.service';

@ApiTags('admin-users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly usersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'List all platform users with role/status filters, search and metrics' })
  @ApiResponse({ status: 200, description: 'Filtered directory of users with count telemetry.' })
  getUsers(@Query() query: AdminUsersQuery) {
    return this.usersService.getUsers(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full profile of a user including restaurant scopes' })
  @ApiResponse({ status: 200, description: 'User profile with permissions.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Super Admin: Create a new user account' })
  createUser(@Body() body: CreateAdminUserDto) {
    return this.usersService.createUser(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Super Admin: Update user profile and reset credentials' })
  updateUser(
    @Param('id') id: string,
    @Body() body: UpdateAdminUserDto,
    @Request() req: any,
  ) {
    return this.usersService.updateUser(id, body, req.user?.id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Super Admin: Delete/deactivate user' })
  deleteUser(@Param('id') id: string, @Request() req: any) {
    return this.usersService.deleteUser(id, req.user?.id);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update a user role (SUPER_ADMIN, ADMIN, MANAGER, STAFF)' })
  @ApiResponse({ status: 200, description: 'Updated role with platform admin privileges.' })
  updateUserRole(
    @Param('id') id: string,
    @Body() body: UpdateUserRoleDto,
    @Request() req: any,
  ) {
    return this.usersService.updateUserRole(id, body.role, req.user?.id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Lockdown or reactivate a user account' })
  @ApiResponse({ status: 200, description: 'Updated account state.' })
  updateUserStatus(
    @Param('id') id: string,
    @Body() body: UpdateUserStatusDto,
    @Request() req: any,
  ) {
    return this.usersService.updateUserStatus(id, body.isActive, req.user?.id);
  }
}

