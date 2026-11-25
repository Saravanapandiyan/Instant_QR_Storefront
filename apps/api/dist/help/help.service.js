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
exports.HelpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
function slugify(text) {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}
let HelpService = class HelpService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getArticlesByAudience(audience, category) {
        const where = { isPublished: true };
        if (audience && audience.toUpperCase() !== 'ALL') {
            where.audience = { in: [audience.toUpperCase(), 'ALL'] };
        }
        if (category) {
            where.category = category;
        }
        return this.prisma.helpArticle.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        });
    }
    async getArticleBySlug(slug) {
        const article = await this.prisma.helpArticle.findUnique({
            where: { slug },
        });
        if (!article || !article.isPublished) {
            throw new common_1.NotFoundException('Help article not found');
        }
        return article;
    }
    async getAllArticlesAdmin(audience) {
        const where = {};
        if (audience && audience !== 'ALL') {
            where.audience = audience;
        }
        return this.prisma.helpArticle.findMany({
            where,
            orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
        });
    }
    async createArticle(dto) {
        let slug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
        if (!slug)
            slug = `article-${Date.now()}`;
        const existing = await this.prisma.helpArticle.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now().toString().slice(-4)}`;
        }
        return this.prisma.helpArticle.create({
            data: {
                title: dto.title.trim(),
                slug,
                content: dto.content,
                audience: dto.audience ? dto.audience.toUpperCase() : 'ALL',
                category: dto.category?.trim() || 'General',
                sortOrder: dto.sortOrder ?? 0,
                isPublished: dto.isPublished ?? true,
            },
        });
    }
    async updateArticle(id, dto) {
        const existing = await this.prisma.helpArticle.findUnique({ where: { id } });
        if (!existing) {
            throw new common_1.NotFoundException('Help article not found');
        }
        let slug = existing.slug;
        if (dto.slug && dto.slug !== existing.slug) {
            slug = slugify(dto.slug);
            const duplicate = await this.prisma.helpArticle.findUnique({ where: { slug } });
            if (duplicate && duplicate.id !== id) {
                throw new common_1.BadRequestException('An article with this slug already exists.');
            }
        }
        else if (dto.title && !dto.slug && !existing.slug) {
            slug = slugify(dto.title);
        }
        return this.prisma.helpArticle.update({
            where: { id },
            data: {
                ...(dto.title ? { title: dto.title.trim() } : {}),
                slug,
                ...(dto.content ? { content: dto.content } : {}),
                ...(dto.audience ? { audience: dto.audience.toUpperCase() } : {}),
                ...(dto.category ? { category: dto.category.trim() } : {}),
                ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
                ...(dto.isPublished !== undefined ? { isPublished: dto.isPublished } : {}),
            },
        });
    }
    async deleteArticle(id) {
        return this.prisma.helpArticle.delete({
            where: { id },
        });
    }
};
exports.HelpService = HelpService;
exports.HelpService = HelpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HelpService);
//# sourceMappingURL=help.service.js.map