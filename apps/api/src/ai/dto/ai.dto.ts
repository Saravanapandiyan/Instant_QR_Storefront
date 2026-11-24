import { IsString, IsOptional, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MenuItemDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class MenuCategoryDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MenuItemDto)
  items: MenuItemDto[];
}

export class QuickSetupDto {
  @IsString()
  restaurantName: string;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  serviceType?: string; // DINE_IN, TAKEAWAY, BOTH

  @IsNumber()
  @IsOptional()
  tablesCount?: number;

  @IsString()
  @IsOptional()
  staffName?: string;

  @IsString()
  @IsOptional()
  staffRole?: string; // CASHIER, KITCHEN, MANAGER

  @IsString()
  @IsOptional()
  staffPin?: string; // 4-digit PIN

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MenuCategoryDto)
  categories?: MenuCategoryDto[];
}

export class GenerateDescriptionDto {
  @IsString()
  dishName: string;

  @IsString()
  @IsOptional()
  categoryName?: string;
}

export class SearchDishImageDto {
  @IsString()
  dishName: string;
}

export class TranslateMenuDto {
  @IsString()
  restaurantId: string;

  @IsArray()
  @IsString({ each: true })
  targetLanguages: string[]; // e.g. ['hi', 'ta', 'te', 'es', 'ar']
}

export class UpdateTranslationDto {
  @IsString()
  langCode: string;

  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;
}
