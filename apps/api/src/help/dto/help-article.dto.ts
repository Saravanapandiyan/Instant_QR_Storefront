import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateHelpArticleDto {
  @ApiProperty({ example: 'How to order food via table QR code' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({ example: 'how-to-order-food-via-table-qr-code' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: '<p>Scan the QR on your table with any camera...</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({ example: 'CUSTOMER', description: 'CUSTOMER | RESTAURANT | ALL' })
  @IsString()
  @IsOptional()
  audience?: string;

  @ApiPropertyOptional({ example: 'Ordering & Menu' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}

export class UpdateHelpArticleDto {
  @ApiPropertyOptional({ example: 'How to order food via table QR code' })
  @IsString()
  @IsOptional()
  title?: string;

  @ApiPropertyOptional({ example: 'how-to-order-food-via-table-qr-code' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ example: '<p>Scan the QR on your table with any camera...</p>' })
  @IsString()
  @IsOptional()
  content?: string;

  @ApiPropertyOptional({ example: 'CUSTOMER' })
  @IsString()
  @IsOptional()
  audience?: string;

  @ApiPropertyOptional({ example: 'Ordering & Menu' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPublished?: boolean;
}
