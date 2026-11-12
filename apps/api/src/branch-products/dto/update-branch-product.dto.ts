import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBranchProductDto {
  @ApiPropertyOptional({
    example: true,
    description: 'Whether the dish is in-stock at this specific branch',
  })
  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @ApiPropertyOptional({
    example: 14.50,
    description: 'Optional price override for this branch (leave null to use restaurant basePrice)',
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  priceOverride?: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether this branch serves this dish at all',
  })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;
}
