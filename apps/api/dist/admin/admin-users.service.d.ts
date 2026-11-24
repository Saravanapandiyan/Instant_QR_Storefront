import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';
export declare class AdminUsersQuery {
    search?: string;
    role?: string;
    status?: 'ALL' | 'ACTIVE' | 'DEACTIVATED';
    restaurantId?: string;
}
export declare class CreateAdminUserDto {
    name: string;
    email: string;
    password: string;
    countryCode?: string;
    phone?: string;
    role: Role;
    restaurantId?: string;
    pinCode?: string;
}
export declare class UpdateAdminUserDto {
    name?: string;
    email?: string;
    countryCode?: string;
    phone?: string;
    role?: Role;
    password?: string;
    pinCode?: string;
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
            staffProfiles: {
                restaurant: {
                    name: string;
                    slug: string;
                    id: string;
                };
                id: string;
                isActive: boolean;
                role: string;
                pinCode: string | null;
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
        staffProfiles: {
            restaurant: {
                name: string;
                slug: string;
                id: string;
            };
            id: string;
            isActive: boolean;
            role: string;
            assignedBranches: import("@prisma/client/runtime/library").JsonValue;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            pinCode: string | null;
        }[];
    }>;
    createUser(dto: CreateAdminUserDto): Promise<{
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
        staffProfiles: {
            restaurant: {
                name: string;
                slug: string;
                id: string;
            };
            id: string;
            isActive: boolean;
            role: string;
            assignedBranches: import("@prisma/client/runtime/library").JsonValue;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            pinCode: string | null;
        }[];
    }>;
    updateUser(id: string, dto: UpdateAdminUserDto, currentAdminId: string): Promise<{
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
        staffProfiles: {
            restaurant: {
                name: string;
                slug: string;
                id: string;
            };
            id: string;
            isActive: boolean;
            role: string;
            assignedBranches: import("@prisma/client/runtime/library").JsonValue;
            permissions: import("@prisma/client/runtime/library").JsonValue;
            pinCode: string | null;
        }[];
    }>;
    deleteUser(id: string, currentAdminId: string): Promise<{
        success: boolean;
        message: string;
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
