import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class AdminUsersQuery {
    search?: string;
    role?: string;
    status?: 'ALL' | 'ACTIVE' | 'DEACTIVATED';
}
export declare class UpdateUserRoleDto {
    role: Role;
}
export declare class UpdateUserStatusDto {
    isActive: boolean;
}
export declare class AdminUsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getUsers(query: AdminUsersQuery): Promise<{
        counts: {
            total: number;
            owners: number;
            staff: number;
            superAdmins: number;
        };
        users: {
            id: string;
            name: string;
            email: string;
            phone: string | null;
            rawPhone: string | null;
            countryCode: string | null;
            role: import("@prisma/client").$Enums.Role;
            isPlatformAdmin: boolean;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            restaurants: {
                name: string;
                slug: string;
                id: string;
                isActive: boolean;
            }[];
        }[];
    }>;
    getUserById(id: string): Promise<{
        isActive: boolean;
        formattedPhone: string | null;
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        isDeleted: boolean;
        restaurants: {
            name: string;
            slug: string;
            id: string;
            isActive: boolean;
            branches: {
                name: string;
                slug: string;
                id: string;
                isActive: boolean;
            }[];
        }[];
        role: import("@prisma/client").$Enums.Role;
        phone: string | null;
        countryCode: string | null;
        email: string;
        isPlatformAdmin: boolean;
    }>;
    updateUserRole(id: string, newRole: Role, currentAdminId: string): Promise<{
        message: string;
        user: {
            name: string;
            id: string;
            updatedAt: Date;
            isDeleted: boolean;
            role: import("@prisma/client").$Enums.Role;
            email: string;
            isPlatformAdmin: boolean;
        };
    }>;
    updateUserStatus(id: string, isActive: boolean, currentAdminId: string): Promise<{
        message: string;
        user: {
            isActive: boolean;
            name: string;
            id: string;
            updatedAt: Date;
            isDeleted: boolean;
            role: import("@prisma/client").$Enums.Role;
            email: string;
        };
    }>;
}
