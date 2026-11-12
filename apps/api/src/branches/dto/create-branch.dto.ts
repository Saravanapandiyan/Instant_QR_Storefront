import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

export class CreateBranchDto {
  @ApiProperty({
    example: 'd9b1a5b8-5f21-4d32-b7e1-8f244190c123',
    description: 'ID of the parent restaurant concept this branch belongs to',
  })
  @IsUUID('4', { message: 'restaurantId must be a valid UUID' })
  @IsNotEmpty({ message: 'restaurantId is required' })
  restaurantId!: string;

  @ApiProperty({
    example: 'Downtown Branch',
    description: 'The physical display name of this branch',
  })
  @IsString()
  @IsNotEmpty({ message: 'Branch name is required' })
  name!: string;

  @ApiPropertyOptional({
    example: 'ananda-downtown',
    description:
      'Optional custom URL slug for this branch storefront (/r/:slug). Auto-generated if omitted.',
  })
  @IsString()
  @IsOptional()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'Slug must contain only lowercase letters, numbers, and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: '102 Main Street, Suite 4',
    description: 'Physical address of this branch location',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({
    example: '+1',
    description: 'International phone dialing code (e.g. +1, +91, +44)',
  })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({
    example: '9876543210',
    description: 'Branch contact phone number',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'INR',
    description: 'Operational billing currency for this branch (e.g. INR, USD, EUR, AED)',
    default: 'INR',
  })
  @IsString()
  @IsOptional()
  currency?: string;
}
