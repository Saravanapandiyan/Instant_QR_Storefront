import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // Helper: Verify user has authority over the restaurant
  private async checkRestaurantAuthority(restaurantId: string, rawUserId: any) {
    const userId =
      typeof rawUserId === 'object' && rawUserId !== null ? rawUserId.id : String(rawUserId);

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId === userId) {
      return { isOwner: true, restaurant };
    }

    // Check if staff has staff.manage permission
    const staff = await this.prisma.staffMember.findUnique({
      where: {
        restaurantId_userId: {
          restaurantId,
          userId,
        },
      },
    });

    if (!staff || !staff.isActive) {
      throw new ForbiddenException('Access denied. You do not have permissions for this restaurant.');
    }

    const permissions = staff.permissions as Record<string, any>;
    if (!permissions?.staff?.view) {
      throw new ForbiddenException('Access denied. You do not have permission to view staff.');
    }

    return { isOwner: false, staff, restaurant };
  }

  // 1. Get all staff members for a restaurant
  async findByRestaurant(restaurantId: string, currentUserId: string) {
    await this.checkRestaurantAuthority(restaurantId, currentUserId);

    const staffMembers = await this.prisma.staffMember.findMany({
      where: { restaurantId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return staffMembers;
  }

  // 2. Create a new staff member
  async create(restaurantId: string, dto: CreateStaffDto, currentUserId: string) {
    const authority = await this.checkRestaurantAuthority(restaurantId, currentUserId);

    if (!authority.isOwner) {
      const permissions = authority.staff?.permissions as Record<string, any>;
      if (!permissions?.staff?.manage) {
        throw new ForbiddenException('You do not have permission to create staff members.');
      }
    }

    const email = dto.email.toLowerCase().trim();
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      const password = dto.password || 'Staff@1234';
      const passwordHash = await bcrypt.hash(password, 10);

      user = await this.prisma.user.create({
        data: {
          email,
          name: dto.name.trim(),
          passwordHash,
          phone: dto.phone?.trim() || null,
          countryCode: dto.countryCode?.trim() || '+91',
          role: 'STAFF',
        },
      });
    } else {
      // Check if already assigned to this restaurant
      const existing = await this.prisma.staffMember.findUnique({
        where: {
          restaurantId_userId: {
            restaurantId,
            userId: user.id,
          },
        },
      });

      if (existing) {
        throw new ConflictException('This user is already a team member for this restaurant');
      }

      // If user exists, update their name/phone if provided
      if (dto.name || dto.phone) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: {
            ...(dto.name ? { name: dto.name.trim() } : {}),
            ...(dto.phone ? { phone: dto.phone.trim() } : {}),
            ...(dto.countryCode ? { countryCode: dto.countryCode.trim() } : {}),
          },
        });
      }
    }

    const staffMember = await this.prisma.staffMember.create({
      data: {
        restaurantId,
        userId: user.id,
        role: dto.role,
        assignedBranches: dto.assignedBranches || ['ALL'],
        permissions: dto.permissions,
        pinCode: dto.pinCode?.trim() || null,
        isActive: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            role: true,
          },
        },
      },
    });

    return staffMember;
  }

  // 3. Update an existing staff member
  async update(id: string, dto: UpdateStaffDto, currentUserId: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
      include: { restaurant: true },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const authority = await this.checkRestaurantAuthority(staff.restaurantId, currentUserId);
    if (!authority.isOwner) {
      const permissions = authority.staff?.permissions as Record<string, any>;
      if (!permissions?.staff?.manage) {
        throw new ForbiddenException('You do not have permission to update staff members.');
      }
    }

    // Update user fields if provided
    if (dto.name || dto.phone || dto.password) {
      const userUpdateData: any = {};
      if (dto.name) userUpdateData.name = dto.name.trim();
      if (dto.phone) userUpdateData.phone = dto.phone.trim();
      if (dto.countryCode) userUpdateData.countryCode = dto.countryCode.trim();
      if (dto.password) {
        userUpdateData.passwordHash = await bcrypt.hash(dto.password, 10);
      }

      await this.prisma.user.update({
        where: { id: staff.userId },
        data: userUpdateData,
      });
    }

    const updated = await this.prisma.staffMember.update({
      where: { id },
      data: {
        ...(dto.role ? { role: dto.role } : {}),
        ...(dto.assignedBranches ? { assignedBranches: dto.assignedBranches } : {}),
        ...(dto.permissions ? { permissions: dto.permissions } : {}),
        ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        ...(dto.pinCode !== undefined ? { pinCode: dto.pinCode?.trim() || null } : {}),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            role: true,
          },
        },
      },
    });

    return updated;
  }

  // 4. Toggle Active / Inactive
  async toggleActive(id: string, currentUserId: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    await this.checkRestaurantAuthority(staff.restaurantId, currentUserId);

    return this.prisma.staffMember.update({
      where: { id },
      data: { isActive: !staff.isActive },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            countryCode: true,
            role: true,
          },
        },
      },
    });
  }

  // 5. Delete staff member
  async remove(id: string, currentUserId: string) {
    const staff = await this.prisma.staffMember.findUnique({
      where: { id },
    });

    if (!staff) {
      throw new NotFoundException('Staff member not found');
    }

    const authority = await this.checkRestaurantAuthority(staff.restaurantId, currentUserId);
    if (!authority.isOwner) {
      const permissions = authority.staff?.permissions as Record<string, any>;
      if (!permissions?.staff?.manage) {
        throw new ForbiddenException('You do not have permission to delete staff members.');
      }
    }

    await this.prisma.staffMember.delete({
      where: { id },
    });

    return { message: 'Staff member removed successfully' };
  }
}

