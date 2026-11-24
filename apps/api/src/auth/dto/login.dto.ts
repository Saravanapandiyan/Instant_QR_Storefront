import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'owner@tacobar.com or 9876543210',
    description: 'User email address or registered mobile phone number',
  })
  @IsString()
  @IsNotEmpty({ message: 'Please provide your email address or mobile number' })
  email!: string;

  @ApiProperty({
    example: 'SecurePass123! or 1234',
    description: 'Password or 4-digit POS PIN',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password or PIN is required' })
  password!: string;
}

