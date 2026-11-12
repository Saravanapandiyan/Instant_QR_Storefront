import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({
    example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc',
    description: 'The restaurant ID this product belongs to',
  })
  @IsString()
  @IsNotEmpty()
  restaurantId!: string;

  @ApiProperty({
    example: 'c1b2c3d4-e5f6-7a8b-9c0d-123456789def',
    description: 'The category ID this product belongs to',
  })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiProperty({
    example: 'Classic Double Cheeseburger',
    description: 'The display name of the dish or beverage',
  })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({
    example: 'Two smashed Angus beef patties, aged cheddar, pickles, and house sauce on a brioche bun',
    description: 'Short description or ingredients',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 12.50,
    description: 'Base price of the item',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice!: number;

  @ApiPropertyOptional({
    example: 'products/double-cheeseburger.png',
    description: 'Relative storage path or key (e.g., products/item-name.png)',
  })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
