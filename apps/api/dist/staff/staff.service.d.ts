import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
export declare class StaffService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private checkRestaurantAuthority;
    findByRestaurant(restaurantId: string, currentUserId: string): Promise<({
        user: {
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
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
    })[]>;
    create(restaurantId: string, dto: CreateStaffDto, currentUserId: string): Promise<{
        user: {
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
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
    }>;
    update(id: string, dto: UpdateStaffDto, currentUserId: string): Promise<{
        user: {
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
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
    }>;
    toggleActive(id: string, currentUserId: string): Promise<{
        user: {
            name: string;
            id: string;
            role: import("@prisma/client").$Enums.Role;
            phone: string | null;
            countryCode: string | null;
            email: string;
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
    }>;
    remove(id: string, currentUserId: string): Promise<{
        message: string;
    }>;
}
