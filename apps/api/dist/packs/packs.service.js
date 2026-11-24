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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PacksService = class PacksService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(activeOnly = true) {
        const where = activeOnly ? { isActive: true } : {};
        return this.prisma.pack.findMany({
            where,
            orderBy: { sortOrder: 'asc' },
        });
    }
    async findById(id) {
        const pack = await this.prisma.pack.findUnique({
            where: { id },
        });
        if (!pack) {
            throw new common_1.NotFoundException(`Pack with ID ${id} not found.`);
        }
        return pack;
    }
    async findByCode(code) {
        const pack = await this.prisma.pack.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!pack) {
            throw new common_1.NotFoundException(`Pack with code ${code} not found.`);
        }
        return pack;
    }
    async create(dto) {
        const code = dto.code.trim().toUpperCase();
        const existing = await this.prisma.pack.findUnique({
            where: { code },
        });
        if (existing) {
            throw new common_1.ConflictException(`Pack with code ${code} already exists.`);
        }
        return this.prisma.pack.create({
            data: {
                code,
                name: dto.name.trim(),
                ordersCount: dto.ordersCount,
                bonusCredits: dto.bonusCredits ?? 0,
                priceUsd: dto.priceUsd,
                priceInr: dto.priceInr,
                regionalPricingJson: dto.regionalPricingJson ?? null,
                featuresJson: dto.featuresJson ?? null,
                isActive: dto.isActive ?? true,
                sortOrder: dto.sortOrder ?? 0,
            },
        });
    }
    async update(id, dto) {
        await this.findById(id);
        const data = {};
        if (dto.code !== undefined)
            data.code = dto.code.trim().toUpperCase();
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.ordersCount !== undefined)
            data.ordersCount = dto.ordersCount;
        if (dto.bonusCredits !== undefined)
            data.bonusCredits = dto.bonusCredits;
        if (dto.priceUsd !== undefined)
            data.priceUsd = dto.priceUsd;
        if (dto.priceInr !== undefined)
            data.priceInr = dto.priceInr;
        if (dto.regionalPricingJson !== undefined)
            data.regionalPricingJson = dto.regionalPricingJson;
        if (dto.featuresJson !== undefined)
            data.featuresJson = dto.featuresJson;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.sortOrder !== undefined)
            data.sortOrder = dto.sortOrder;
        return this.prisma.pack.update({
            where: { id },
            data,
        });
    }
    async remove(id) {
        await this.findById(id);
        return this.prisma.pack.delete({
            where: { id },
        });
    }
};
exports.PacksService = PacksService;
exports.PacksService = PacksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PacksService);
//# sourceMappingURL=packs.service.js.map