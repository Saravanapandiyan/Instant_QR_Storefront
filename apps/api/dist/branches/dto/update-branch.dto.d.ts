import { CreateBranchDto } from './create-branch.dto';
declare const UpdateBranchDto_base: import("@nestjs/common", { with: { "resolution-mode": "import" } }).Type<Partial<CreateBranchDto>>;
export declare class UpdateBranchDto extends UpdateBranchDto_base {
    restaurantId?: string;
}
export {};
