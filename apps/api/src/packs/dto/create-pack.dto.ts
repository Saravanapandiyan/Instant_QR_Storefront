import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsInt, IsNumber, Min, IsBoolean } from 'class-validator';

export class CreatePackDto {
  @ApiProperty({
    example: 'PRO',
    description: 'Unique code identifier for the pack (e.g. STARTER, PRO, BUSINESS)',
  })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    example: 'Pro Pack (Popular)',
    description: 'Display name of the pack',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 3000,
    description: 'Base order credits included in the pack',
  })
  @IsInt()
  @Min(1)
  ordersCount: number;

  @ApiPropertyOptional({
    example: 300,
    description: 'Bonus order credits rewarded with the pack',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  bonusCredits?: number;

  @ApiPropertyOptional({
    example: 499.0,
    description: 'Single plan price in platform currency',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: 20.0,
    description: 'Price in USD',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceUsd?: number;

  @ApiPropertyOptional({
    example: 699.0,
    description: 'Price in INR',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  priceInr?: number;

  @ApiPropertyOptional({
    example: { PHP: 1150, MYR: 95 },
    description: 'Optional regional pricing mapping in JSON format',
  })
  @IsOptional()
  regionalPricingJson?: any;

  @ApiPropertyOptional({
    example: {
      qrMenu: true,
      aiMenuImport: true,
      dailyReports: true,
      kitchenScreen: true,
    },
    description: 'Feature flag permissions unlocked with this pack',
  })
  @IsOptional()
  featuresJson?: any;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the pack is active and visible for purchase',
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 4,
    description: 'Display sequence order (lower numbers appear first)',
    default: 0,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  sortOrder?: number;
}
