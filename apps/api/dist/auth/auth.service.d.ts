import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BootstrapSuperAdminDto } from './dto/bootstrap-super-admin.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwtService;
    constructor(prisma: PrismaService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<{
        user: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
            isPlatformAdmin: boolean;
        };
        accessToken: string;
    }>;
    login(dto: LoginDto): Promise<{
        user: {
            staffProfiles: ({
                restaurant: {
                    name: string;
                    slug: string;
                    id: string;
                };
            } & {
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                restaurantId: string;
                userId: string;
                role: string;
                assignedBranches: import("@prisma/client/runtime/library").JsonValue;
                permissions: import("@prisma/client/runtime/library").JsonValue;
                pinCode: string | null;
            })[];
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
            isPlatformAdmin: boolean;
        };
        accessToken: string;
    }>;
    private generateToken;
    updateProfile(userId: string, dto: {
        name?: string;
        email?: string;
        countryCode?: string;
        phone?: string;
    }): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        deletedAt: Date | null;
        deletedBy: string | null;
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        countryCode: string | null;
        email: string;
        isPlatformAdmin: boolean;
    }>;
    changePassword(userId: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
    getAdminStatus(): Promise<{
        hasSuperAdmin: boolean;
        totalSuperAdmins: number;
    }>;
    bootstrapSuperAdmin(dto: BootstrapSuperAdminDto): Promise<{
        user: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
            isPlatformAdmin: boolean;
        };
        accessToken: string;
    }>;
    adminLogin(dto: LoginDto): Promise<{
        user: {
            name: string;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            isDeleted: boolean;
            deletedAt: Date | null;
            deletedBy: string | null;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
            isPlatformAdmin: boolean;
        };
        accessToken: string;
    }>;
}
