import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { IsOptional, IsString, IsEnum, IsBoolean, IsNotEmpty, IsEmail } from 'class-validator';
import * as bcrypt from 'bcrypt';
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

  @IsOptional()
  @IsString()
  restaurantId?: string;
}

export class CreateAdminUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(Role)
  role: Role;

  @IsOptional()
  @IsString()
  restaurantId?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;
}

export class UpdateAdminUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  countryCode?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsString()
  pinCode?: string;
}

const RoleEnum = (Role as any) || {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  STAFF: 'STAFF',
};

export class UpdateUserRoleDto {
  @IsEnum(RoleEnum)
  role: Role;
}

export class UpdateUserStatusDto {
  @IsBoolean()
  isActive: boolean;
}

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  // 1. Get users directory with search, role/status filtering and scope filtering
  async getUsers(query: AdminUsersQuery) {
    const { search, role, status = 'ALL', restaurantId } = query;

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

    // Global Header Scope filtering: filter by restaurantId
    if (restaurantId && restaurantId !== 'ALL') {
      where.OR = [
        { restaurants: { some: { id: restaurantId, isDeleted: false } } },
        { staffProfiles: { some: { restaurantId, isActive: true } } },
      ];
    }

    // Search by name, email, phone
    if (search && search.trim().length > 0) {
      const q = search.trim().toLowerCase();
      const searchCondition = [
        { name: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q, mode: 'insensitive' } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchCondition }];
        delete where.OR;
      } else {
        where.OR = searchCondition;
      }
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
          staffProfiles: {
            select: {
              id: true,
              role: true,
              pinCode: true,
              isActive: true,
              restaurant: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                },
              },
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
      staffProfiles: u.staffProfiles,
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
        staffProfiles: {
          select: {
            id: true,
            role: true,
            pinCode: true,
            isActive: true,
            assignedBranches: true,
            permissions: true,
            restaurant: {
              select: {
                id: true,
                name: true,
                slug: true,
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

  // 3. Super Admin: Create a new User
  async createUser(dto: CreateAdminUserDto) {
    const email = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      throw new ConflictException(`User with email "${email}" already exists.`);
    }

    const passwordHash = await bcrypt.hash(dto.password.trim(), 10);

    const user = await this.prisma.user.create({
      data: {
        name: dto.name.trim(),
        email,
        passwordHash,
        countryCode: dto.countryCode || '+91',
        phone: dto.phone?.trim() || null,
        role: dto.role,
        isPlatformAdmin: dto.role === Role.SUPER_ADMIN,
      },
    });

    // If restaurantId is provided and role is STAFF or MANAGER, create a StaffMember record
    if (dto.restaurantId && (dto.role === Role.STAFF || dto.role === Role.MANAGER)) {
      await this.prisma.staffMember.create({
        data: {
          restaurantId: dto.restaurantId,
          userId: user.id,
          role: dto.role === Role.MANAGER ? 'MANAGER' : 'CASHIER',
          pinCode: dto.pinCode?.trim() || '1234',
          assignedBranches: ['ALL'],
          permissions: {
            canCreateOrders: true,
            canSettleOrders: true,
            canAccessKds: true,
          },
        },
      });
    }

    return this.getUserById(user.id);
  }

  // 4. Super Admin: Update user details and reset credentials
  async updateUser(id: string, dto: UpdateAdminUserDto, currentAdminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    const data: any = {};
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.email !== undefined) {
      const email = dto.email.trim().toLowerCase();
      if (email !== user.email) {
        const emailTaken = await this.prisma.user.findUnique({ where: { email } });
        if (emailTaken) throw new ConflictException(`Email "${email}" is already registered.`);
        data.email = email;
      }
    }
    if (dto.countryCode !== undefined) data.countryCode = dto.countryCode;
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.role !== undefined) {
      data.role = dto.role;
      data.isPlatformAdmin = dto.role === Role.SUPER_ADMIN;
    }
    if (dto.password && dto.password.trim().length > 0) {
      data.passwordHash = await bcrypt.hash(dto.password.trim(), 10);
    }

    // Update User
    await this.prisma.user.update({
      where: { id },
      data,
    });

    // If PIN code provided, update in staffProfiles
    if (dto.pinCode && dto.pinCode.trim().length > 0) {
      await this.prisma.staffMember.updateMany({
        where: { userId: id },
        data: { pinCode: dto.pinCode.trim() },
      });
    }

    return this.getUserById(id);
  }

  // 5. Super Admin: Delete (soft-delete) user
  async deleteUser(id: string, currentAdminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (id === currentAdminId) {
      throw new ForbiddenException('Super Administrators cannot delete their own active account.');
    }

    if (user.role === Role.SUPER_ADMIN) {
      const remainingSuperAdmins = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN, isDeleted: false, id: { not: id } },
      });
      if (remainingSuperAdmins < 1) {
        throw new ForbiddenException('Cannot delete the last remaining active Super Admin.');
      }
    }

    await this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: currentAdminId,
      },
    });

    return {
      success: true,
      message: `User "${user.name}" has been successfully removed.`,
    };
  }

  // 6. Update user role
  async updateUserRole(id: string, newRole: Role, currentAdminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (!Object.values(Role).includes(newRole)) {
      throw new BadRequestException(`Invalid role: ${newRole}`);
    }

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

  // 7. Update user active / disabled status
  async updateUserStatus(id: string, isActive: boolean, currentAdminId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found.`);
    }

    if (!isActive && id === currentAdminId) {
      throw new ForbiddenException('Super Administrators cannot deactivate their own active session.');
    }

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
