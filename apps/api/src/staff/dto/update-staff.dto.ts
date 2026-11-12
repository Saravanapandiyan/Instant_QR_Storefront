import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, IsArray, IsObject, IsBoolean, MinLength } from 'class-validator';

export class UpdateStaffDto {
  @ApiPropertyOptional({ example: 'Ramesh Kumar' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'ramesh@ananda.com' })
  @IsEmail({}, { message: 'Valid email is required' })
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ example: '+91' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ example: '9840123456' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'NewPass123!' })
  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @ApiPropertyOptional({ example: '1234' })
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiPropertyOptional({ example: 'MANAGER' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: ['branch-id-1'] })
  @IsArray()
  @IsOptional()
  assignedBranches?: string[];

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  permissions?: Record<string, any>;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

