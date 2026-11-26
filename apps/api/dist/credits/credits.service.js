"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditsService = void 0;
const common_1 = require("@nestjs/common");
const stripe_1 = __importDefault(require("stripe"));
const prisma_service_1 = require("../prisma/prisma.service");
let CreditsService = class CreditsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async verifyRestaurantAccess(restaurantId, userId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: restaurantId },
            include: {
                staffMembers: {
                    where: { userId },
                },
            },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException(`Restaurant with ID ${restaurantId} not found.`);
        }
        const isOwner = restaurant.ownerId === userId;
        const isStaff = restaurant.staffMembers.length > 0;
        if (!isOwner && !isStaff) {
            const user = await this.prisma.user.findUnique({ where: { id: userId } });
            if (user?.role !== 'SUPER_ADMIN') {
                throw new common_1.ForbiddenException(`You do not have access to this restaurant's credit ledger.`);
            }
        }
        return restaurant;
    }
    async getBalance(restaurantId, userId) {
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
    async getLedger(restaurantId, userId, limit = 50, page = 1) {
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
    async getStripeClient() {
        const setting = await this.prisma.platformSetting.findUnique({
            where: { key: 'STRIPE_CONFIG' },
        });
        const config = setting?.value;
        if (!config || !config.isActive) {
            throw new common_1.BadRequestException('Stripe payment gateway is currently disabled. Please contact the platform administrator to enable online payments.');
        }
        const mode = config.mode === 'live' ? 'live' : 'test';
        const activeSecretKey = mode === 'live' ? config.liveSecretKey : config.testSecretKey;
        if (!activeSecretKey || activeSecretKey.trim() === '') {
            throw new common_1.BadRequestException(`Stripe ${mode.toUpperCase()} Secret Key is not configured in Admin Panel. Please configure keys under Platform Configuration > Stripe Gateway.`);
        }
        try {
            const stripe = new stripe_1.default(activeSecretKey.trim(), {
                apiVersion: '2023-10-16',
            });
            return {
                stripe,
                config: {
                    mode,
                    defaultCurrency: config.defaultCurrency || 'INR',
                    isActive: config.isActive,
                },
            };
        }
        catch (err) {
            throw new common_1.BadRequestException(`Failed to initialize Stripe client: ${err.message}`);
        }
    }
    async createStripeCheckoutSession(dto, userId, rawOrigin) {
        const restaurant = await this.verifyRestaurantAccess(dto.restaurantId, userId);
        const pack = await this.prisma.pack.findUnique({
            where: { id: dto.packId },
        });
        if (!pack || !pack.isActive) {
            throw new common_1.BadRequestException('Selected credit pack is not available for purchase.');
        }
        const { stripe, config } = await this.getStripeClient();
        const brandingSetting = await this.prisma.platformSetting.findUnique({
            where: { key: 'SITE_BRANDING' },
        });
        const brandingCurrency = brandingSetting?.value?.defaultCurrency;
        const targetCurrency = (dto.currency ||
            brandingCurrency ||
            config.defaultCurrency ||
            'INR').toLowerCase();
        let unitAmount;
        if (targetCurrency === 'usd') {
            unitAmount = Math.round(Number(pack.priceUsd || pack.priceInr) * 100);
        }
        else {
            unitAmount = Math.round(Number(pack.priceInr || pack.priceUsd) * 100);
        }
        if (unitAmount <= 0) {
            throw new common_1.BadRequestException('Pack price must be greater than zero for card checkout.');
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
                throw new common_1.BadRequestException('Stripe failed to return a checkout redirect URL.');
            }
            return {
                checkoutUrl: session.url,
                sessionId: session.id,
            };
        }
        catch (err) {
            throw new common_1.BadRequestException(err.message || 'Failed to create Stripe Checkout session.');
        }
    }
    async verifyAndFulfillStripeSession(sessionId, userId) {
        if (!sessionId || !sessionId.trim()) {
            throw new common_1.BadRequestException('Invalid session ID');
        }
        const { stripe } = await this.getStripeClient();
        let session;
        try {
            session = await stripe.checkout.sessions.retrieve(sessionId.trim());
        }
        catch (err) {
            throw new common_1.BadRequestException(`Unable to retrieve Stripe session: ${err.message}`);
        }
        if (session.payment_status !== 'paid') {
            throw new common_1.BadRequestException(`Payment has not been completed. Status: ${session.payment_status}`);
        }
        const restaurantId = session.metadata?.restaurantId || session.client_reference_id;
        if (!restaurantId) {
            throw new common_1.BadRequestException('Missing restaurant reference in Stripe session.');
        }
        const restaurant = await this.verifyRestaurantAccess(restaurantId, userId);
        const totalCredits = Number(session.metadata?.totalCredits || 0);
        const packName = session.metadata?.packName || 'Order Credit Pack';
        if (totalCredits <= 0) {
            throw new common_1.BadRequestException('Invalid credit amount in session metadata.');
        }
        return this.prisma.$transaction(async (tx) => {
            await tx.$executeRaw `SELECT pg_advisory_xact_lock(hashtext(${session.id}))`;
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
    async purchasePack(dto, userId, rawOrigin) {
        return this.createStripeCheckoutSession({
            restaurantId: dto.restaurantId,
            packId: dto.packId,
        }, userId, rawOrigin);
    }
    async adjustCredits(dto, adminUserId) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException(`Restaurant ${dto.restaurantId} not found.`);
        }
        if (dto.delta === 0) {
            throw new common_1.BadRequestException(`Adjustment delta cannot be 0.`);
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
};
exports.CreditsService = CreditsService;
exports.CreditsService = CreditsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CreditsService);
//# sourceMappingURL=credits.service.js.map