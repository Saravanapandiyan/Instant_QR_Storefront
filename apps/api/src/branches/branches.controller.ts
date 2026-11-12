import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('branches')
@Controller('branches')
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new branch under a restaurant (Owner only)' })
  @ApiResponse({ status: 201, description: 'Branch created successfully.' })
  create(
    @CurrentUser() user: any,
    @Body() createDto: CreateBranchDto,
  ) {
    return this.branchesService.create(createDto, user.id);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all branches owned by the current user across all restaurants' })
  findMine(@CurrentUser() user: any) {
    return this.branchesService.findMine(user.id);
  }

  @Get('restaurant/:restaurantId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all branches belonging to a specific restaurant' })
  @ApiParam({ name: 'restaurantId' })
  findByRestaurant(@Param('restaurantId') restaurantId: string) {
    return this.branchesService.findByRestaurant(restaurantId);
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Public storefront lookup by QR code slug (e.g. /r/:slug)' })
  @ApiParam({ name: 'slug' })
  findBySlug(@Param('slug') slug: string) {
    return this.branchesService.findBySlug(slug);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a branch by ID' })
  @ApiParam({ name: 'id' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a branch (Owner only)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateBranchDto,
    @CurrentUser() user: any,
  ) {
    return this.branchesService.update(id, updateDto, user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a branch (Owner only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.branchesService.remove(id, user.id);
  }
}
