import { Strategy } from 'passport-jwt';
import { PrismaService } from '../prisma/prisma.service';
export interface JwtPayload {
    sub: string;
    email: string;
    role: string;
}
declare const JwtStrategy_base: new (...args: [opt: import("passport-jwt").StrategyOptionsWithRequest] | [opt: import("passport-jwt").StrategyOptionsWithoutRequest]) => Strategy & {
    validate(...args: any[]): unknown;
};
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly prisma;
    constructor(prisma: PrismaService);
    validate(payload: JwtPayload): Promise<{
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
    }>;
}
export {};
