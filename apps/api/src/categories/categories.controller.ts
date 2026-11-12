import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) { }

    // 1. POST /api/v1/categories (Protected)
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new category for a restaurant branch' })
    @ApiResponse({ status: 201, description: 'Category created successfully' })
    create(@Body() createCategoryDto: CreateCategoryDto) {
        return this.categoriesService.create(createCategoryDto);
    }

    // 2. GET /api/v1/categories/restaurant/:restaurantId (Public - Customers & Owner)
    @Get('restaurant/:restaurantId')
    @ApiOperation({ summary: 'Get all active categories for a restaurant' })
    @ApiResponse({ status: 200, description: 'List of categories ordered by sortOrder' })
    findAllByRestaurant(@Param('restaurantId') restaurantId: string) {
        return this.categoriesService.findAllByRestaurant(restaurantId);
    }

    // 3. GET /api/v1/categories/:id (Protected)
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get category details by ID' })
    @ApiResponse({ status: 200, description: 'Category found' })
    findOne(@Param('id') id: string) {
        return this.categoriesService.findOne(id);
    }

    // 4. PATCH /api/v1/categories/:id (Protected)
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update a category (name, description, isActive, sortOrder)' })
    @ApiResponse({ status: 200, description: 'Category updated successfully' })
    update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        return this.categoriesService.update(id, updateCategoryDto);
    }

    // 5. DELETE /api/v1/categories/:id (Protected - Soft delete with audit)
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Soft delete a category' })
    @ApiResponse({ status: 200, description: 'Category soft-deleted successfully' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.categoriesService.remove(id, user.id);
    }
}
