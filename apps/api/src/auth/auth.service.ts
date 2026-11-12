import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BootstrapSuperAdminDto } from './dto/bootstrap-super-admin.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // 1. Register a new Restaurant Owner
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    // Encrypt password using bcrypt (10 salt rounds)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase(),
        passwordHash,
        name: dto.name,
        countryCode: dto.countryCode,
        phone: dto.phone,
        role: 'ADMIN',
      },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      user: sanitizedUser,
      accessToken,
    };
  }

  // 2. Login an existing user
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase() },
      include: {
        staffProfiles: {
          include: {
            restaurant: {
              select: { id: true, name: true, slug: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // If staff user and all staff profiles are inactive, reject
    if (user.role === 'STAFF' && user.staffProfiles.length > 0) {
      const hasActiveProfile = user.staffProfiles.some((sp) => sp.isActive);
      if (!hasActiveProfile) {
        throw new ForbiddenException(
          'Your staff account has been deactivated. Please contact your restaurant administrator.',
        );
      }
    }

    // Compare raw password with stored hash
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);

    const { passwordHash: _, ...sanitizedUser } = user;
    return {
      user: sanitizedUser,
      accessToken,
    };
  }

  // Helper: Sign JWT token
  private generateToken(userId: string, email: string, role: string): string {
    const payload = { sub: userId, email, role };
    return this.jwtService.sign(payload);
  }

  // 3. Update logged-in user profile details (name, email, countryCode, phone)
  async updateProfile(userId: string, dto: { name?: string; email?: string; countryCode?: string; phone?: string }) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const emailTaken = await this.prisma.user.findUnique({
        where: { email: dto.email.toLowerCase() },
      });
      if (emailTaken && emailTaken.id !== userId) {
        throw new ConflictException('This email is already in use by another account');
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name ? { name: dto.name.trim() } : {}),
        ...(dto.email ? { email: dto.email.toLowerCase().trim() } : {}),
        ...(dto.countryCode !== undefined ? { countryCode: dto.countryCode?.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone?.trim() || null } : {}),
      },
    });

    const { passwordHash: _, ...sanitizedUser } = updatedUser;
    return sanitizedUser;
  }

  // 4. Change user password with current password verification
  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(currentPass, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Current password does not match');
    }

    const newPasswordHash = await bcrypt.hash(newPass, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    return { message: 'Password updated successfully' };
  }

  // 5. Get platform Super Admin status (public check for bootstrap availability)
  async getAdminStatus() {
    const count = await this.prisma.user.count({
      where: {
        role: 'SUPER_ADMIN',
        isDeleted: false,
      },
    });

    return {
      hasSuperAdmin: count > 0,
      totalSuperAdmins: count,
    };
  }

  // 6. Bootstrap Initial Super Admin (or create with setup key if already initialized)
  async bootstrapSuperAdmin(dto: BootstrapSuperAdminDto) {
    const existingSuperAdminCount = await this.prisma.user.count({
      where: {
        role: 'SUPER_ADMIN',
        isDeleted: false,
      },
    });

    // If Super Admin already exists, enforce secret setupKey check
    if (existingSuperAdminCount > 0) {
      const configuredSecret = process.env.ADMIN_SETUP_SECRET || 'instant-qr-admin-secret-2026';
      if (!dto.setupKey || dto.setupKey !== configuredSecret) {
        throw new ForbiddenException(
          'Platform bootstrap is locked because a Super Admin account already exists. Provide a valid ADMIN_SETUP_SECRET key to create additional administrators.',
        );
      }
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (existingUser) {
      throw new ConflictException('An account with this email address already exists');
    }

    // Encrypt password using bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email.toLowerCase().trim(),
        passwordHash,
        name: dto.name.trim(),
        countryCode: dto.countryCode?.trim() || '+91',
        phone: dto.phone?.trim() || null,
        role: 'SUPER_ADMIN',
        isPlatformAdmin: true,
      },
    });

    const accessToken = this.generateToken(user.id, user.email, user.role);
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
    };
  }

  // 7. Dedicated Super Admin Login (strictly rejects non-super-admins)
  async adminLogin(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.toLowerCase().trim() },
    });

    if (!user || user.isDeleted) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check that user is a Super Admin
    if (user.role !== 'SUPER_ADMIN' && !user.isPlatformAdmin) {
      throw new ForbiddenException(
        'Access denied. This portal is strictly restricted to Platform Super Administrators.',
      );
    }

    const accessToken = this.generateToken(user.id, user.email, user.role);
    const { passwordHash: _, ...sanitizedUser } = user;

    return {
      user: sanitizedUser,
      accessToken,
    };
  }
}
