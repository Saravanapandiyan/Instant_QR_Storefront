import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class BootstrapSuperAdminDto {
  @ApiProperty({ example: 'admin@instantqr.io', description: 'Super Admin email address' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email!: string;

  @ApiProperty({ example: 'SuperAdminSecret123!', description: 'Super Admin password (min 8 characters)' })
  @IsString()
  @MinLength(8, { message: 'Super Admin password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Root Administrator', description: 'Full name of the Platform Administrator' })
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @ApiPropertyOptional({ example: '+91', description: 'Dialing code' })
  @IsString()
  @IsOptional()
  countryCode?: string;

  @ApiPropertyOptional({ example: '9999999999', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({
    example: 'instant-qr-admin-secret-2026',
    description: 'Setup key required if a Super Admin already exists in the system',
  })
  @IsString()
  @IsOptional()
  setupKey?: string;
}

