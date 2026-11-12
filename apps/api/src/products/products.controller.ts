import 'multer';
import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Query,
    UseGuards,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
    ApiQuery,
    ApiConsumes,
    ApiBody,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) { }

    // 1. POST /api/v1/products (Protected - Multipart Form with Image)
    @Post()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Create a new food item with optional image upload' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                restaurantId: { type: 'string', example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc' },
                categoryId: { type: 'string', example: 'c1b2c3d4-e5f6-7a8b-9c0d-123456789def' },
                name: { type: 'string', example: 'Classic Double Cheeseburger' },
                description: { type: 'string', example: 'Two smashed Angus beef patties, cheddar, pickles' },
                price: { type: 'number', example: 12.50 },
                isAvailable: { type: 'boolean', example: true },
                image: { type: 'string', format: 'binary' },
            },
            required: ['restaurantId', 'categoryId', 'name', 'price'],
        },
    })
    @ApiResponse({ status: 201, description: 'Product created successfully' })
    create(
        @Body() createProductDto: CreateProductDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.productsService.create(createProductDto, file);
    }

    // 2. GET /api/v1/products/restaurant/:restaurantId (Public - Customers & Admin)
    @Get('restaurant/:restaurantId')
    @ApiOperation({ summary: 'Get all dishes for a restaurant with search & filters' })
    @ApiQuery({ name: 'categoryId', required: false, type: String })
    @ApiQuery({ name: 'search', required: false, type: String })
    @ApiQuery({ name: 'isAvailable', required: false, type: Boolean })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of products' })
    findAllByRestaurant(
        @Param('restaurantId') restaurantId: string,
        @Query('categoryId') categoryId?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.productsService.findAllByRestaurant(restaurantId, {
            categoryId,
            search,
            page,
            limit,
        });
    }

    // 3. GET /api/v1/products/:id (Protected - Admin inspect/edit)
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get product details by ID' })
    @ApiResponse({ status: 200, description: 'Product found' })
    findOne(@Param('id') id: string) {
        return this.productsService.findOne(id);
    }

    // 4. PATCH /api/v1/products/:id (Protected - Multipart Form with optional new Image)
    @Patch(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @UseInterceptors(FileInterceptor('image'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Update product details (with optional new image)' })
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                basePrice: { type: 'number' },
                categoryId: { type: 'string' },
                image: { type: 'string', format: 'binary' },
            },
        },
    })
    @ApiResponse({ status: 200, description: 'Product updated successfully' })
    update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
        @UploadedFile() file?: Express.Multer.File,
    ) {
        return this.productsService.update(id, updateProductDto, file);
    }

    // 5. DELETE /api/v1/products/:id (Protected - Soft delete with audit)
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Soft delete a product' })
    @ApiResponse({ status: 200, description: 'Product soft-deleted successfully' })
    remove(@Param('id') id: string, @CurrentUser() user: any) {
        return this.productsService.remove(id, user.id);
    }
}
