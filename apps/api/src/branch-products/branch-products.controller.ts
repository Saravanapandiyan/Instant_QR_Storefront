import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { BranchProductsService } from './branch-products.service';
import { UpdateBranchProductDto } from './dto/update-branch-product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('branch-products')
@Controller('branch-products')
export class BranchProductsController {
  constructor(private readonly service: BranchProductsService) {}

  @Patch(':branchId/:productId/toggle-availability')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'One-click Toggle In-Stock / Sold Out for a specific branch' })
  @ApiParam({ name: 'branchId' })
  @ApiParam({ name: 'productId' })
  toggleAvailability(
    @Param('branchId') branchId: string,
    @Param('productId') productId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.toggleAvailability(branchId, productId, user.id);
  }

  @Patch(':branchId/:productId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update branch stock, price override, or enablement' })
  @ApiParam({ name: 'branchId' })
  @ApiParam({ name: 'productId' })
  updateOverride(
    @Param('branchId') branchId: string,
    @Param('productId') productId: string,
    @Body() dto: UpdateBranchProductDto,
    @CurrentUser() user: any,
  ) {
    return this.service.updateOverride(branchId, productId, dto, user.id);
  }

  @Get('restaurant/:restaurantId/matrix')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get full branch product availability & pricing matrix for a restaurant concept' })
  @ApiParam({ name: 'restaurantId' })
  getRestaurantMatrix(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: any,
  ) {
    return this.service.getRestaurantMatrix(restaurantId, user.id);
  }

  @Get('branch/:branchId/menu')
  @ApiOperation({ summary: 'Get full branch menu for customer table QR storefront' })
  @ApiParam({ name: 'branchId' })
  getBranchMenu(@Param('branchId') branchId: string) {
    return this.service.getBranchMenu(branchId);
  }
}
