import { CreateCategoryDto } from "./create-category.dto";
declare const UpdateCategoryDto_base: import("@nestjs/common", { with: { "resolution-mode": "import" } }).Type<Partial<CreateCategoryDto>>;
export declare class UpdateCategoryDto extends UpdateCategoryDto_base {
    isActive?: boolean;
}
export {};
