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
exports.AdminBranchesService = exports.CreateAdminTableDto = exports.UpdateAdminBranchDto = exports.CreateAdminBranchDto = exports.AdminBranchesQuery = void 0;
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const prisma_service_1 = require("../prisma/prisma.service");
class AdminBranchesQuery {
    restaurantId;
    search;
    status;
}
exports.AdminBranchesQuery = AdminBranchesQuery;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminBranchesQuery.prototype, "restaurantId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminBranchesQuery.prototype, "search", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdminBranchesQuery.prototype, "status", void 0);
class CreateAdminBranchDto {
    restaurantId;
    name;
    slug;
    address;
    phone;
    countryCode;
    currency;
}
exports.CreateAdminBranchDto = CreateAdminBranchDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "restaurantId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminBranchDto.prototype, "currency", void 0);
class UpdateAdminBranchDto {
    name;
    slug;
    address;
    phone;
    countryCode;
    currency;
    isActive;
}
exports.UpdateAdminBranchDto = UpdateAdminBranchDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminBranchDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminBranchDto.prototype, "slug", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminBranchDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminBranchDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminBranchDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateAdminBranchDto.prototype, "currency", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateAdminBranchDto.prototype, "isActive", void 0);
class CreateAdminTableDto {
    tableNumber;
    section;
    capacity;
}
exports.CreateAdminTableDto = CreateAdminTableDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminTableDto.prototype, "tableNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAdminTableDto.prototype, "section", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAdminTableDto.prototype, "capacity", void 0);
let AdminBranchesService = class AdminBranchesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getBranches(query) {
        const { restaurantId, search, status = 'ALL' } = query;
        const where = { isDeleted: false };
        if (restaurantId && restaurantId !== 'ALL') {
            where.restaurantId = restaurantId;
        }
        if (status === 'ACTIVE') {
            where.isActive = true;
        }
        else if (status === 'INACTIVE') {
            where.isActive = false;
        }
        if (search && search.trim().length > 0) {
            const q = search.trim().toLowerCase();
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { slug: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
                { restaurant: { name: { contains: q, mode: 'insensitive' } } },
            ];
        }
        const [totalCount, activeCount, branches] = await Promise.all([
            this.prisma.branch.count({ where: { isDeleted: false } }),
            this.prisma.branch.count({ where: { isDeleted: false, isActive: true } }),
            this.prisma.branch.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                include: {
                    restaurant: {
                        select: {
                            id: true,
                            name: true,
                            slug: true,
                            defaultCurrency: true,
                            logoUrl: true,
                        },
                    },
                    _count: {
                        select: {
                            tables: true,
                            orders: true,
                            branchProducts: true,
                        },
                    },
                },
            }),
        ]);
        const formatted = branches.map((b) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            address: b.address,
            phone: b.phone ? `${b.countryCode || '+91'} ${b.phone}` : null,
            rawPhone: b.phone,
            countryCode: b.countryCode,
            currency: b.currency,
            isActive: b.isActive,
            restaurantId: b.restaurantId,
            restaurant: b.restaurant,
            tablesCount: b._count.tables,
            ordersCount: b._count.orders,
            productsCount: b._count.branchProducts,
            createdAt: b.createdAt,
            updatedAt: b.updatedAt,
        }));
        return {
            counts: {
                total: totalCount,
                active: activeCount,
                inactive: totalCount - activeCount,
            },
            branches: formatted,
        };
    }
    async getBranchById(id) {
        const branch = await this.prisma.branch.findFirst({
            where: { id, isDeleted: false },
            include: {
                restaurant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        defaultCurrency: true,
                        logoUrl: true,
                    },
                },
                tables: {
                    orderBy: { tableNumber: 'asc' },
                },
                _count: {
                    select: {
                        tables: true,
                        orders: true,
                        branchProducts: true,
                    },
                },
            },
        });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch with ID ${id} not found.`);
        }
        return branch;
    }
    async createBranch(dto) {
        const restaurant = await this.prisma.restaurant.findUnique({
            where: { id: dto.restaurantId },
        });
        if (!restaurant) {
            throw new common_1.NotFoundException(`Restaurant ${dto.restaurantId} not found.`);
        }
        let slug = dto.slug ? dto.slug.trim().toLowerCase() : '';
        if (!slug) {
            const baseSlug = dto.name
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
            slug = `${restaurant.slug}-${baseSlug}`;
        }
        const existingSlug = await this.prisma.branch.findUnique({
            where: { slug },
        });
        if (existingSlug) {
            slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
        }
        const branch = await this.prisma.branch.create({
            data: {
                restaurantId: dto.restaurantId,
                name: dto.name.trim(),
                slug,
                address: dto.address?.trim() || null,
                phone: dto.phone?.trim() || null,
                countryCode: dto.countryCode || '+91',
                currency: dto.currency || restaurant.defaultCurrency || 'INR',
                isActive: true,
            },
        });
        await this.prisma.restaurantTable.createMany({
            data: [
                { branchId: branch.id, tableNumber: 'Table 1', section: 'Main Hall', capacity: 4 },
                { branchId: branch.id, tableNumber: 'Table 2', section: 'Main Hall', capacity: 4 },
                { branchId: branch.id, tableNumber: 'Table 3', section: 'Main Hall', capacity: 6 },
                { branchId: branch.id, tableNumber: 'Counter 1', section: 'Takeaway', capacity: 2 },
            ],
            skipDuplicates: true,
        });
        return this.getBranchById(branch.id);
    }
    async updateBranch(id, dto) {
        const branch = await this.prisma.branch.findFirst({
            where: { id, isDeleted: false },
        });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch ${id} not found.`);
        }
        const data = {};
        if (dto.name !== undefined)
            data.name = dto.name.trim();
        if (dto.address !== undefined)
            data.address = dto.address.trim();
        if (dto.phone !== undefined)
            data.phone = dto.phone.trim();
        if (dto.countryCode !== undefined)
            data.countryCode = dto.countryCode;
        if (dto.currency !== undefined)
            data.currency = dto.currency;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.slug && dto.slug.trim().toLowerCase() !== branch.slug) {
            const slug = dto.slug.trim().toLowerCase();
            const existing = await this.prisma.branch.findUnique({ where: { slug } });
            if (existing)
                throw new common_1.ConflictException(`Slug "/r/${slug}" is already in use.`);
            data.slug = slug;
        }
        await this.prisma.branch.update({
            where: { id },
            data,
        });
        return this.getBranchById(id);
    }
    async deleteBranch(id, adminUserId) {
        const branch = await this.prisma.branch.findFirst({
            where: { id, isDeleted: false },
        });
        if (!branch) {
            throw new common_1.NotFoundException(`Branch ${id} not found.`);
        }
        await this.prisma.branch.update({
            where: { id },
            data: {
                isDeleted: true,
                deletedAt: new Date(),
                deletedBy: adminUserId,
            },
        });
        return {
            success: true,
            message: `Branch "${branch.name}" successfully archived.`,
        };
    }
    async getTables(branchId) {
        return this.prisma.restaurantTable.findMany({
            where: { branchId },
            orderBy: { tableNumber: 'asc' },
        });
    }
    async createTable(branchId, dto) {
        const branch = await this.prisma.branch.findFirst({ where: { id: branchId, isDeleted: false } });
        if (!branch)
            throw new common_1.NotFoundException(`Branch ${branchId} not found.`);
        const existing = await this.prisma.restaurantTable.findUnique({
            where: { branchId_tableNumber: { branchId, tableNumber: dto.tableNumber.trim() } },
        });
        if (existing) {
            throw new common_1.ConflictException(`Table "${dto.tableNumber}" already exists in this outlet.`);
        }
        return this.prisma.restaurantTable.create({
            data: {
                branchId,
                tableNumber: dto.tableNumber.trim(),
                section: dto.section?.trim() || 'Main Hall',
                capacity: dto.capacity || 4,
                isActive: true,
            },
        });
    }
    async deleteTable(tableId) {
        await this.prisma.restaurantTable.delete({
            where: { id: tableId },
        });
        return { success: true };
    }
};
exports.AdminBranchesService = AdminBranchesService;
exports.AdminBranchesService = AdminBranchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AdminBranchesService);
//# sourceMappingURL=admin-branches.service.js.map