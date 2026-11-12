export declare class CreateStaffDto {
    name: string;
    email: string;
    countryCode?: string;
    phone?: string;
    password?: string;
    pinCode?: string;
    role: string;
    assignedBranches: string[];
    permissions: Record<string, any>;
}
