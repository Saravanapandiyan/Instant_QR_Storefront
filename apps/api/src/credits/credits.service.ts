import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../prisma/prisma.service';
import { PurchasePackDto } from './dto/purchase-pack.dto';
import { AdjustCreditsDto } from './dto/adjust-credits.dto';

@Injectable()
export class CreditsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: verify user has ownership or staff management access to restaurant
   */
  private async verifyRestaurantAccess(restaurantId: string, userId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: {
        staffMembers: {
          where: { userId },
        },
      },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${restaurantId} not found.`);
    }

    const isOwner = restaurant.ownerId === userId;
    const isStaff = restaurant.staffMembers.length > 0;

    if (!isOwner && !isStaff) {
      // Also check if user is a system SUPER_ADMIN
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user?.role !== 'SUPER_ADMIN') {
        throw new ForbiddenException(`You do not have access to this restaurant's credit ledger.`);
      }
    }

    return restaurant;
  }

  /**
   * 1. Get real-time credit balance and grace buffer metrics
   */
  async getBalance(restaurantId: string, userId: string) {
    const restaurant = await this.verifyRestaurantAccess(restaurantId, userId);
    const balance = restaurant.creditBalance;

    const isGraceMode = balance < 0;
    const graceOrdersUsed = isGraceMode ? Math.abs(balance) : 0;
    const graceOrdersRemaining = isGraceMode ? Math.max(0, 20 + balance) : 20;
    const isExhausted = balance <= -20;
    const isLowCredit = balance < 20 && balance > 0;

    return {
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      creditBalance: balance,
      isGraceMode,
      graceOrdersUsed,
      graceOrdersRemaining,
      isExhausted,
      isLowCredit,
    };
  }

  /**
   * 2. Append-only Transaction Ledger Audit Trail
   */
  async getLedger(restaurantId: string, userId: string, limit = 50, page = 1) {
    await this.verifyRestaurantAccess(restaurantId, userId);

    const take = Math.min(100, Math.max(1, limit));
    const skip = (Math.max(1, page) - 1) * take;

    const [entries, total] = await Promise.all([
      this.prisma.creditLedger.findMany({
        where: { restaurantId },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.creditLedger.count({
        where: { restaurantId },
      }),
    ]);

    return {
      entries,
      total,
      page,
      limit: take,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Helper: Retrieve Stripe client with configuration from platform settings
   */
  private async getStripeClient(): Promise<{
    stripe: Stripe;
    config: {
      mode: 'test' | 'live';
      defaultCurrency: string;
      isActive: boolean;
    };
  }> {
    const setting = await this.prisma.platformSetting.findUnique({
      where: { key: 'STRIPE_CONFIG' },
    });

    const config = setting?.value as any;

    if (!config || !config.isActive) {
      throw new BadRequestException(
        'Stripe payment gateway is currently disabled. Please contact the platform administrator to enable online payments.'
      );
    }

    const mode = config.mode === 'live' ? 'live' : 'test';
    const activeSecretKey = mode === 'live' ? config.liveSecretKey : config.testSecretKey;

    if (!activeSecretKey || activeSecretKey.trim() === '') {
      throw new BadRequestException(
        `Stripe ${mode.toUpperCase()} Secret Key is not configured in Admin Panel. Please configure keys under Platform Configuration > Stripe Gateway.`
      );
    }

    try {
      const stripe = new Stripe(activeSecretKey.trim(), {
        apiVersion: '2023-10-16' as any,
      });
      return {
        stripe,
        config: {
          mode,
          defaultCurrency: config.defaultCurrency || 'INR',
          isActive: config.isActive,
        },
      };
    } catch (err: any) {
      throw new BadRequestException(`Failed to initialize Stripe client: ${err.message}`);
    }
  }

  /**
   * 3. Create a Real Stripe Checkout Session for Pack Top-Up
   */
  async createStripeCheckoutSession(
    dto: { restaurantId: string; packId: string; currency?: string },
    userId: string,
    rawOrigin?: string,
  ): Promise<{ checkoutUrl: string; sessionId: string }> {
    const restaurant = await this.verifyRestaurantAccess(dto.restaurantId, userId);

    const pack = await this.prisma.pack.findUnique({
      where: { id: dto.packId },
    });

    if (!pack || !pack.isActive) {
      throw new BadRequestException('Selected credit pack is not available for purchase.');
    }

    const { stripe, config } = await this.getStripeClient();

    // Read platform currency from Site Branding settings first, fallback to Stripe config
    const brandingSetting = await this.prisma.platformSetting.findUnique({
      where: { key: 'SITE_BRANDING' },
    });
    const brandingCurrency = (brandingSetting?.value as any)?.defaultCurrency;
    const targetCurrency = (
      dto.currency ||
      brandingCurrency ||
      config.defaultCurrency ||
      'INR'
    ).toLowerCase();

    // Determine unit amount in smallest currency unit (e.g. paise/cents)
    let unitAmount: number;
    if (targetCurrency === 'usd') {
      unitAmount = Math.round(Number(pack.priceUsd || pack.priceInr) * 100);
    } else {
      unitAmount = Math.round(Number(pack.priceInr || pack.priceUsd) * 100);
    }

    if (unitAmount <= 0) {
      throw new BadRequestException('Pack price must be greater than zero for card checkout.');
    }

    const totalCredits = pack.ordersCount + (pack.bonusCredits || 0);
    const origin = (rawOrigin || 'http://localhost:5173').replace(/\/+$/, '');

    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });

      const session = await stripe.checkout.sessions.create({
        line_items: [
          {
            price_data: {
              currency: targetCurrency,
              product_data: {
                name: `${pack.name} (${totalCredits.toLocaleString()} Orders Credit Pack)`,
                description: `Prepaid Order Credits Top-Up for ${restaurant.name} (${pack.ordersCount.toLocaleString()} orders + ${(pack.bonusCredits || 0).toLocaleString()} free bonus)`,
              },
              unit_amount: unitAmount,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${origin}/billing?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${origin}/billing?canceled=true`,
        client_reference_id: restaurant.id,
        customer_email: user?.email || undefined,
        metadata: {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          packId: pack.id,
          packName: pack.name,
          ordersCount: String(pack.ordersCount),
          bonusCredits: String(pack.bonusCredits || 0),
          totalCredits: String(totalCredits),
          priceCharged: String(unitAmount / 100),
          currency: targetCurrency.toUpperCase(),
          userId,
        },
      });

      if (!session.url) {
        throw new BadRequestException('Stripe failed to return a checkout redirect URL.');
      }

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    } catch (err: any) {
      throw new BadRequestException(err.message || 'Failed to create Stripe Checkout session.');
    }
  }

  /**
   * 4. Verify and Fulfill Paid Stripe Checkout Session (Atomically & Idempotently)
   */
  async verifyAndFulfillStripeSession(sessionId: string, userId: string) {
    if (!sessionId || !sessionId.trim()) {
      throw new BadRequestException('Invalid session ID');
    }

    const { stripe } = await this.getStripeClient();

    let session: Stripe.Checkout.Session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId.trim());
    } catch (err: any) {
      throw new BadRequestException(`Unable to retrieve Stripe session: ${err.message}`);
    }

    if (session.payment_status !== 'paid') {
      throw new BadRequestException(
        `Payment has not been completed. Status: ${session.payment_status}`
      );
    }

    const restaurantId = session.metadata?.restaurantId || session.client_reference_id;
    if (!restaurantId) {
      throw new BadRequestException('Missing restaurant reference in Stripe session.');
    }

    // Verify user has access to this restaurant
    const restaurant = await this.verifyRestaurantAccess(restaurantId, userId);

    const totalCredits = Number(session.metadata?.totalCredits || 0);
    const packName = session.metadata?.packName || 'Order Credit Pack';

    if (totalCredits <= 0) {
      throw new BadRequestException('Invalid credit amount in session metadata.');
    }

    // Atomic execution with PostgreSQL transaction-scoped advisory lock + idempotency protection
    return this.prisma.$transaction(async (tx) => {
      // Serialize concurrent verification requests for the same Stripe session ID
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${session.id}))`;

      const existing = await tx.creditLedger.findFirst({
        where: {
          restaurantId: restaurant.id,
          refId: session.id,
        },
      });

      if (existing) {
        return {
          success: true,
          message: 'Credits for this payment have already been applied to your balance.',
          packName,
          creditsAdded: existing.delta,
          newBalance: existing.balanceAfter,
          paymentMethod: 'STRIPE',
          invoiceRef: existing.refId,
          isDuplicate: true,
        };
      }

      const updatedRest = await tx.restaurant.update({
        where: { id: restaurant.id },
        data: {
          creditBalance: {
            increment: totalCredits,
          },
        },
        select: { creditBalance: true, name: true },
      });

      const ledgerEntry = await tx.creditLedger.create({
        data: {
          restaurantId: restaurant.id,
          delta: totalCredits,
          reason: 'PACK_PURCHASE',
          refId: session.id,
          balanceAfter: updatedRest.creditBalance,
        },
      });

      return {
        success: true,
        message: `Successfully topped up ${totalCredits.toLocaleString()} credits via Stripe!`,
        packName,
        creditsAdded: totalCredits,
        newBalance: updatedRest.creditBalance,
        paymentMethod: 'STRIPE',
        invoiceRef: ledgerEntry.refId,
        createdAt: ledgerEntry.createdAt,
      };
    });
  }

  /**
   * 5. Legacy / Direct Purchase Pack (Enforces Stripe Checkout)
   */
  async purchasePack(dto: PurchasePackDto, userId: string, rawOrigin?: string) {
    // Enforce real Stripe checkout session creation
    return this.createStripeCheckoutSession(
      {
        restaurantId: dto.restaurantId,
        packId: dto.packId,
      },
      userId,
      rawOrigin,
    );
  }

  /**
   * 4. Super Admin: Manual Credit Adjustment
   */
  async adjustCredits(dto: AdjustCreditsDto, adminUserId: string) {
    // Validate restaurant
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: dto.restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant ${dto.restaurantId} not found.`);
    }

    if (dto.delta === 0) {
      throw new BadRequestException(`Adjustment delta cannot be 0.`);
    }

    const refId = `ADMIN_ADJ_${Date.now()}_${adminUserId.substring(0, 8)}`;

    return this.prisma.$transaction(async (tx) => {
      const updatedRest = await tx.restaurant.update({
        where: { id: restaurant.id },
        data: {
          creditBalance: {
            increment: dto.delta,
          },
        },
        select: { creditBalance: true, name: true },
      });

      const ledgerEntry = await tx.creditLedger.create({
        data: {
          restaurantId: restaurant.id,
          delta: dto.delta,
          reason: dto.reason.trim().toUpperCase() || 'ADMIN_ADJUSTMENT',
          refId,
          balanceAfter: updatedRest.creditBalance,
        },
      });

      return {
        success: true,
        message: `Credit adjusted by ${dto.delta > 0 ? '+' : ''}${dto.delta}`,
        newBalance: updatedRest.creditBalance,
        entry: ledgerEntry,
      };
    });
  }
}
