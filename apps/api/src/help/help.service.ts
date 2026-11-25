import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHelpArticleDto, UpdateHelpArticleDto } from './dto/help-article.dto';

function slugify(text: string): string {
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

@Injectable()
export class HelpService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get published articles by audience (CUSTOMER, RESTAURANT, or ALL)
  async getArticlesByAudience(audience?: string, category?: string) {
    const where: any = { isPublished: true };

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

  // 2. Get single article by slug
  async getArticleBySlug(slug: string) {
    const article = await this.prisma.helpArticle.findUnique({
      where: { slug },
    });
    if (!article || !article.isPublished) {
      throw new NotFoundException('Help article not found');
    }
    return article;
  }

  // 3. Admin: Get all articles (published & drafts)
  async getAllArticlesAdmin(audience?: string) {
    const where: any = {};
    if (audience && audience !== 'ALL') {
      where.audience = audience;
    }
    return this.prisma.helpArticle.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { updatedAt: 'desc' }],
    });
  }

  // 4. Admin: Create article
  async createArticle(dto: CreateHelpArticleDto) {
    let slug = dto.slug ? slugify(dto.slug) : slugify(dto.title);
    if (!slug) slug = `article-${Date.now()}`;

    // Ensure unique slug
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

  // 5. Admin: Update article
  async updateArticle(id: string, dto: UpdateHelpArticleDto) {
    const existing = await this.prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Help article not found');
    }

    let slug = existing.slug;
    if (dto.slug && dto.slug !== existing.slug) {
      slug = slugify(dto.slug);
      const duplicate = await this.prisma.helpArticle.findUnique({ where: { slug } });
      if (duplicate && duplicate.id !== id) {
        throw new BadRequestException('An article with this slug already exists.');
      }
    } else if (dto.title && !dto.slug && !existing.slug) {
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

  // 6. Admin: Delete article
  async deleteArticle(id: string) {
    return this.prisma.helpArticle.delete({
      where: { id },
    });
  }
}
