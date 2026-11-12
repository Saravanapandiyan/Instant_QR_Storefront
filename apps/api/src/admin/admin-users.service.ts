import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { IsOptional, IsString, IsEnum, IsBoolean } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

export class AdminUsersQuery {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsString()
  status?: 'ALL' | 'ACTIVE' | 'DEACTIVATED';
}

export class UpdateUserRoleDto {
  @IsEnum(Role)
  role: Role;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get users directory with search, role/status filtering and telemetry counts
  async getUsers(query: AdminUsersQuery) {
    const { search, role, status = 'ALL' } = query;

    const where: any = {};

    // Filter by active/deactivated status
    if (status === 'ACTIVE') {
      where.isDeleted = false;
    } else if (status === 'DEACTIVATED') {
      where.isDeleted = true;
    }

    // Filter by role
    if (role && role !== 'ALL') {
      if (['SUPER_ADMIN', 'ADMIN', 'MANAGER', 'STAFF'].includes(role.toUpperCase())) {
        where.role = role.toUpperCase() as Role;
      }
    }

    // Search by name, email, phone
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [totalCount, ownersCount, staffCount, superAdminsCount, users] = await Promise.all([
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.user.count({ where: { isDeleted: false, role: Role.ADMIN } }),
      this.prisma.user.count({
        where: {
          isDeleted: false,
          role: { in: [Role.MANAGER, Role.STAFF] },
        },
      }),
      this.prisma.user.count({ where: { isDeleted: false, role: Role.SUPER_ADMIN } }),
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          countryCode: true,
          phone: true,
          role: true,
          isPlatformAdmin: true,
          isDeleted: true,
          createdAt: true,
          updatedAt: true,
          restaurants: {
            where: { isDeleted: false },
            select: {
              id: true,
              name: true,
              slug: true,
              isActive: true,
            },
          },
        },
      }),
    ]);

    const formattedUsers = users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      phone: u.phone ? `${u.countryCode || '+91'} ${u.phone}` : null,
      rawPhone: u.phone,
      countryCode: u.countryCode,
      role: u.role,
      isPlatformAdmin: u.isPlatformAdmin,
      isActive: !u.isDeleted,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      restaurants: u.restaurants,
    }));

    return {
      counts: {
        total: totalCount,
        owners: ownersCount,
        staff: staffCount,
        superAdmins: superAdminsCount,
      },
      users: formattedUsers,
    };
  }

  // 2. Get single user details
  async getUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        countryCode: true,
        phone: true,
        role: true,
        isPlatformAdmin: true,
        isDeleted: true,
        createdAt: true,
        updatedAt: true,
        restaurants: {
          where: { isDeleted: false },
          select: {
            id: true,
            name: true,
            slug: true,
            isActive: true,
            branches: {
              where: { isDeleted: false },
              select: {
                id: true,
                name: true,
                slug: true,
                isActive: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    return {
      ...user,
      isActive: !user.isDeleted,
      formattedPhone: user.phone ? `${user.countryCode || '+91'} ${user.phone}` : null,
    };
  }

  // 3. Update user role
  async updateUserRole(id: string, newRole: Role, currentAdminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (!Object.values(Role).includes(newRole)) {
      throw new BadRequestException(`Invalid role: ${newRole}`);
    }

    // Safety: If demoting a SUPER_ADMIN, ensure another active SUPER_ADMIN exists
    if (user.role === Role.SUPER_ADMIN && newRole !== Role.SUPER_ADMIN) {
      const remainingSuperAdmins = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isDeleted: false,
          id: { not: id },
        },
      });

      if (remainingSuperAdmins < 1) {
        throw new ForbiddenException('Cannot demote the last remaining active Super Admin.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        role: newRole,
        isPlatformAdmin: newRole === Role.SUPER_ADMIN,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPlatformAdmin: true,
        isDeleted: true,
        updatedAt: true,
      },
    });

    return {
      message: `User role successfully updated to ${newRole}.`,
      user: updated,
    };
  }

  // 4. Update user active / disabled status (lockdown)
  async updateUserStatus(id: string, isActive: boolean, currentAdminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    // Prevent self-deactivation
    if (!isActive && id === currentAdminId) {
      throw new ForbiddenException('Super Administrators cannot deactivate their own active session.');
    }

    // Safety: If deactivating a SUPER_ADMIN, ensure another active SUPER_ADMIN exists
    if (!isActive && user.role === Role.SUPER_ADMIN) {
      const remainingSuperAdmins = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isDeleted: false,
          id: { not: id },
        },
      });

      if (remainingSuperAdmins < 1) {
        throw new ForbiddenException('Cannot deactivate the last remaining active Super Admin.');
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: !isActive,
        deletedAt: isActive ? null : new Date(),
        deletedBy: isActive ? null : currentAdminId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isDeleted: true,
        updatedAt: true,
      },
    });

    return {
      message: isActive ? 'Account reactivated successfully.' : 'Account disabled successfully.',
      user: {
        ...updated,
        isActive: !updated.isDeleted,
      },
    };
  }
}
