import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PacksService } from './packs.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('packs')
@Controller('packs')
export class PacksController {
  constructor(private readonly packsService: PacksService) {}

  @Get()
  @ApiOperation({ summary: 'Get active credit packs for restaurant owners & checkout' })
  getActivePacks() {
    return this.packsService.findAll(true);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Get all packs including inactive ones' })
  getAllPacks() {
    return this.packsService.findAll(false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get pack details by ID' })
  getPackById(@Param('id') id: string) {
    return this.packsService.findById(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Create a new credit pack' })
  createPack(@Body() dto: CreatePackDto) {
    return this.packsService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Update pack pricing, bonus, or features' })
  updatePack(@Param('id') id: string, @Body() dto: UpdatePackDto) {
    return this.packsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Super Admin: Delete a pack' })
  deletePack(@Param('id') id: string) {
    return this.packsService.remove(id);
  }
}
