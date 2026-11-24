import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export class PurchasePackDto {
  @ApiProperty({
    example: 'd9b2d63d-a123-4b5c-9d8e-123456789abc',
    description: 'The restaurant ID to top up credits for',
  })
  @IsString()
  @IsNotEmpty()
  restaurantId: string;

  @ApiProperty({
    example: 'c8a1b2d3-e4f5-6789-0abc-def123456789',
    description: 'The pack ID being purchased',
  })
  @IsString()
  @IsNotEmpty()
  packId: string;

  @ApiProperty({
    example: 'STRIPE',
    description: 'Payment method utilized (STRIPE, RAZORPAY, MOCK_CARD)',
    enum: ['STRIPE', 'RAZORPAY', 'MOCK_CARD'],
  })
  @IsString()
  @IsNotEmpty()
  paymentMethod: 'STRIPE' | 'RAZORPAY' | 'MOCK_CARD';

  @ApiPropertyOptional({
    example: 'idemp_txn_17950000_abc123',
    description: 'Optional client idempotency key to prevent double charging',
  })
  @IsString()
  @IsOptional()
  idempotencyKey?: string;
}
