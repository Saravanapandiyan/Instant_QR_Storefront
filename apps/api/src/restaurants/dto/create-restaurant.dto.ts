import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateRestaurantDto {
  @ApiProperty({
    example: 'Ananda Pure Veg',
    description: 'The display name of the restaurant concept',
  })
  @IsString()
  @IsNotEmpty({ message: 'Restaurant name is required' })
  name!: string;

  @ApiPropertyOptional({
    example: 'ananda-pure-veg',
    description: 'Optional URL slug for the restaurant concept. Auto-generated if omitted.',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'Authentic South Indian vegetarian specialties.',
    description: 'Description of the restaurant food concept',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/logo.png',
    description: 'Logo image URL for the restaurant concept',
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({
    example: 'INR',
    description: 'Default master catalog currency (e.g. INR, USD, EUR, AED)',
    default: 'INR',
  })
  @IsString()
  @IsOptional()
  defaultCurrency?: string;

  @ApiPropertyOptional({
    description: 'Storefront theme configuration for customer mobile app (light & dark palettes)',
  })
  @IsOptional()
  themeConfig?: any;
}
