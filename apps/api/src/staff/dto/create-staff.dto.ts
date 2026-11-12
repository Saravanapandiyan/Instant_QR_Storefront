import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, IsArray, IsObject, MinLength } from 'class-validator';

export class CreateStaffDto {
  @ApiProperty({ example: 'Ramesh Kumar', description: 'Staff member full name' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @ApiProperty({ example: 'ramesh@ananda.com', description: 'Staff email address' })
  @IsEmail({}, { message: 'Valid email is required' })
  email!: string;

  @ApiPropertyOptional({ example: '+91', description: 'Country code' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ example: '9840123456', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ example: 'StaffPass123!', description: 'Password (min 6 characters)' })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password?: string;

  @ApiPropertyOptional({ example: '1234', description: 'Optional 4-digit quick POS PIN' })
  @IsString()
  @IsOptional()
  pinCode?: string;

  @ApiProperty({ example: 'CASHIER', description: 'Role preset (MANAGER, CASHIER, KITCHEN, CUSTOM)' })
  @IsString()
  @IsNotEmpty()
  role!: string;

  @ApiProperty({ example: ['ALL'], description: 'Assigned branch IDs or ["ALL"]' })
  @IsArray()
  assignedBranches!: string[];

  @ApiProperty({ description: 'Granular permissions object' })
  @IsObject()
  permissions!: Record<string, any>;
}

