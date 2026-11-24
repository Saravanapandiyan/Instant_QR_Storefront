import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsInt, IsOptional } from 'class-validator';

export class AdjustCreditsDto {
  @ApiProperty({
    example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc',
    description: 'The restaurant ID to adjust credits for',
  })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({
    example: 500,
    description: 'Credit adjustment delta (+ to grant, - to deduct)',
  })
  @IsInt()
  delta: number;

  @ApiProperty({
    example: 'ADMIN_ADJUSTMENT',
    description: 'Reason for the credit adjustment',
  })
  @IsString()
  @IsNotEmpty()
  reason: string;

  @ApiPropertyOptional({
    example: 'Granted for promotional partnership pilot',
    description: 'Optional note or reference ticket',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
