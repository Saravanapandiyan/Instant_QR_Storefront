import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { BootstrapSuperAdminDto } from './dto/bootstrap-super-admin.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    getProfile(user: any): any;
    updateProfile(user: any, dto: UpdateProfileDto): Promise<{
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
    changePassword(user: any, dto: ChangePasswordDto): Promise<{
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
