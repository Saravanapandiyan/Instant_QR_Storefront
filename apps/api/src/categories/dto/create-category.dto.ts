import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, Min } from 'class-validator';

export class CreateCategoryDto {
    @ApiProperty({
        example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc',
        description: 'The restaurant/branch ID this category belongs to',
    })
    @IsString()
    @IsNotEmpty()
    restaurantId: string;

    @ApiProperty({
        example: 'Burgers & Sandwiches',
        description: 'The display name of the category',
    })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiPropertyOptional({
        example: 'Served with crispy fries and dip',
        description: 'Optional short description',
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({
        example: 0,
        description: 'Display order on the menu (lower numbers appear first)',
        default: 0,
    })
    @IsInt()
    @Min(0)
    @IsOptional()
    sortOrder?: number;
}
