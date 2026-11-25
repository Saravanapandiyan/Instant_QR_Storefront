import { IsString, IsNotEmpty, IsOptional, IsEnum, IsArray, ValidateNested, IsInt, Min, Max, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderType, PaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  branchSlug: string;

  @IsString()
  @IsNotEmpty()
  customerName: string;

  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @IsOptional()
  @IsString()
  tableNumber?: string;

  @IsOptional()
  @IsEnum(OrderType)
  orderType?: OrderType;

  @IsOptional()
  @IsString()
  orderNotes?: string;

  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsString()
  turnstileToken?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsString()
  cancelReason?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(180)
  prepTimeMinutes?: number;
}

export class UpdatePaymentStatusDto {
  @IsEnum(PaymentStatus)
  paymentStatus: PaymentStatus;
}

export class UpdatePaymentSettingsDto {
  @IsNotEmpty()
  @IsBoolean()
  enableCash: boolean;

  @IsOptional()
  @IsBoolean()
  enableUpi?: boolean;

  @IsOptional()
  @IsString()
  upiId?: string;

  @IsOptional()
  @IsString()
  upiName?: string;

  @IsOptional()
  @IsBoolean()
  enableTax?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  taxRate?: number;

  @IsOptional()
  @IsString()
  gstNumber?: string;
}

