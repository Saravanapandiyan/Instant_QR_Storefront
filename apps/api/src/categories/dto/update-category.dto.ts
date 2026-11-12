import { PartialType, ApiPropertyOptional } from "@nestjs/swagger";
import { CreateCategoryDto } from "./create-category.dto";
import { IsOptional, IsBoolean } from "class-validator";

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
    @ApiPropertyOptional({
        example: true,
        description: 'Whether the category is visible on the digital menu'
    })
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}

