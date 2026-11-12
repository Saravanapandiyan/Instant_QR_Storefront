import 'multer';
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
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { RestaurantsService } from './restaurants.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('restaurants')
@Controller('restaurants')
export class RestaurantsController {
  constructor(private readonly restaurantsService: RestaurantsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new restaurant concept with optional logo' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: { type: 'string', example: 'Ananda Pure Veg' },
        description: { type: 'string', example: 'Pure vegetarian South Indian' },
        logo: { type: 'string', format: 'binary' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'The restaurant was successfully created.',
  })
  create(
    @CurrentUser() user: any,
    @Body() createDto: CreateRestaurantDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.restaurantsService.create(createDto, user.id, file);
  }

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all restaurant concepts owned by current user' })
  @ApiResponse({ status: 200, description: 'List of restaurants with branches and counts.' })
  findMine(@CurrentUser() user: any) {
    return this.restaurantsService.findMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a restaurant concept by ID' })
  @ApiParam({ name: 'id' })
  @ApiResponse({ status: 200, description: 'The restaurant was found.' })
  findOne(@Param('id') id: string) {
    return this.restaurantsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Update a restaurant concept (Owner only)' })
  @ApiParam({ name: 'id' })
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateRestaurantDto,
    @CurrentUser() user: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.restaurantsService.update(id, updateDto, user.id, file);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a restaurant concept (Owner only)' })
  @ApiParam({ name: 'id' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.restaurantsService.remove(id, user.id);
  }
}
