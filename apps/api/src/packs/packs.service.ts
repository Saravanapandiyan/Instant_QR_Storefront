import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePackDto } from './dto/create-pack.dto';
import { UpdatePackDto } from './dto/update-pack.dto';

@Injectable()
export class PacksService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch all visible packs for storefront / restaurant owner billing
   */
  async findAll(activeOnly = true) {
    const where = activeOnly ? { isActive: true } : {};
    return this.prisma.pack.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
  }

  /**
   * Fetch single pack by ID
   */
  async findById(id: string) {
    const pack = await this.prisma.pack.findUnique({
      where: { id },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with ID ${id} not found.`);
    }

    return pack;
  }

  /**
   * Fetch single pack by code (e.g. FREE, PRO, BUSINESS)
   */
  async findByCode(code: string) {
    const pack = await this.prisma.pack.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!pack) {
      throw new NotFoundException(`Pack with code ${code} not found.`);
    }

    return pack;
  }

  /**
   * Super Admin: Create a new credit pack
   */
  async create(dto: CreatePackDto) {
    const code = dto.code.trim().toUpperCase();

    const existing = await this.prisma.pack.findUnique({
      where: { code },
    });

    if (existing) {
      throw new ConflictException(`Pack with code ${code} already exists.`);
    }

    const resolvedPrice = dto.price ?? dto.priceInr ?? dto.priceUsd ?? 0;

    return this.prisma.pack.create({
      data: {
        code,
        name: dto.name.trim(),
        ordersCount: dto.ordersCount,
        bonusCredits: dto.bonusCredits ?? 0,
        priceUsd: dto.priceUsd ?? resolvedPrice,
        priceInr: dto.priceInr ?? resolvedPrice,
        regionalPricingJson: dto.regionalPricingJson ?? null,
        featuresJson: dto.featuresJson ?? null,
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
  }

  /**
   * Super Admin: Update an existing pack
   */
  async update(id: string, dto: UpdatePackDto) {
    await this.findById(id);

    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code.trim().toUpperCase();
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.ordersCount !== undefined) data.ordersCount = dto.ordersCount;
    if (dto.bonusCredits !== undefined) data.bonusCredits = dto.bonusCredits;
    if (dto.price !== undefined) {
      data.priceUsd = dto.price;
      data.priceInr = dto.price;
    }
    if (dto.priceUsd !== undefined) data.priceUsd = dto.priceUsd;
    if (dto.priceInr !== undefined) data.priceInr = dto.priceInr;
    if (dto.regionalPricingJson !== undefined) data.regionalPricingJson = dto.regionalPricingJson;
    if (dto.featuresJson !== undefined) data.featuresJson = dto.featuresJson;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;

    return this.prisma.pack.update({
      where: { id },
      data,
    });
  }

  /**
   * Super Admin: Delete or deactivate a pack
   */
  async remove(id: string) {
    await this.findById(id);
    return this.prisma.pack.delete({
      where: { id },
    });
  }
}
