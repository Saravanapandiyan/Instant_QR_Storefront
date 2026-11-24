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
  AdminBranchesService,
  AdminBranchesQuery,
  CreateAdminBranchDto,
  UpdateAdminBranchDto,
  CreateAdminTableDto,
} from './admin-branches.service';

@ApiTags('admin-branches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, SuperAdminGuard)
@Controller('admin/branches')
export class AdminBranchesController {
  constructor(private readonly branchesService: AdminBranchesService) {}

  @Get()
  @ApiOperation({ summary: 'List all physical branch outlets with scoping and status filtering' })
  @ApiResponse({ status: 200, description: 'Filtered list of outlets with counts.' })
  getBranches(@Query() query: AdminBranchesQuery) {
    return this.branchesService.getBranches(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full branch details with table manifests' })
  getBranchById(@Param('id') id: string) {
    return this.branchesService.getBranchById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Super Admin: Provision a new branch outlet' })
  createBranch(@Body() body: CreateAdminBranchDto) {
    return this.branchesService.createBranch(body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Super Admin: Update branch information' })
  updateBranch(@Param('id') id: string, @Body() body: UpdateAdminBranchDto) {
    return this.branchesService.updateBranch(id, body);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Super Admin: Archive branch outlet' })
  deleteBranch(@Param('id') id: string, @Request() req: any) {
    return this.branchesService.deleteBranch(id, req.user?.id);
  }

  @Get(':id/tables')
  @ApiOperation({ summary: 'Get tables for a branch' })
  getTables(@Param('id') branchId: string) {
    return this.branchesService.getTables(branchId);
  }

  @Post(':id/tables')
  @ApiOperation({ summary: 'Create table standee in a branch' })
  createTable(@Param('id') branchId: string, @Body() body: CreateAdminTableDto) {
    return this.branchesService.createTable(branchId, body);
  }

  @Delete(':id/tables/:tableId')
  @ApiOperation({ summary: 'Delete table standee' })
  deleteTable(@Param('tableId') tableId: string) {
    return this.branchesService.deleteTable(tableId);
  }
}
