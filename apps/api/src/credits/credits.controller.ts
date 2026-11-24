import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CreditsService } from './credits.service';
import { PurchasePackDto } from './dto/purchase-pack.dto';
import { AdjustCreditsDto } from './dto/adjust-credits.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';

@ApiTags('credits')
@Controller('credits')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CreditsController {
  constructor(private readonly creditsService: CreditsService) {}

  @Get('balance/:restaurantId')
  @ApiOperation({ summary: 'Get live credit balance and grace buffer metrics for restaurant' })
  getBalance(@Param('restaurantId') restaurantId: string, @Request() req: any) {
    return this.creditsService.getBalance(restaurantId, req.user.id);
  }

  @Get('ledger/:restaurantId')
  @ApiOperation({ summary: 'Get append-only transactional credit ledger history' })
  getLedger(
    @Param('restaurantId') restaurantId: string,
    @Query('limit') limit?: number,
    @Query('page') page?: number,
    @Request() req?: any,
  ) {
    return this.creditsService.getLedger(
      restaurantId,
      req.user.id,
      limit ? Number(limit) : 50,
      page ? Number(page) : 1,
    );
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Create Stripe Checkout Session for pack purchase' })
  createCheckout(
    @Body() dto: { restaurantId: string; packId: string; currency?: string },
    @Request() req: any,
  ) {
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
    return this.creditsService.createStripeCheckoutSession(dto, req.user.id, origin);
  }

  @Post('verify-session')
  @ApiOperation({ summary: 'Verify completed Stripe checkout session and credit restaurant' })
  verifySession(@Body() dto: { sessionId: string }, @Request() req: any) {
    return this.creditsService.verifyAndFulfillStripeSession(dto.sessionId, req.user.id);
  }

  @Post('purchase')
  @ApiOperation({ summary: 'Purchase a credit pack with transactional top-up' })
  purchasePack(@Body() dto: PurchasePackDto, @Request() req: any) {
    const origin = req.headers.origin || req.headers.referer || 'http://localhost:5173';
    return this.creditsService.purchasePack(dto, req.user.id, origin);
  }

  @Post('adjust')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Super Admin: Manually adjust restaurant credits' })
  adjustCredits(@Body() dto: AdjustCreditsDto, @Request() req: any) {
    return this.creditsService.adjustCredits(dto, req.user.id);
  }
}
