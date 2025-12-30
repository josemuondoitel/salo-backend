// Product DTOs
import {
  IsString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
  IsObject,
} from 'class-validator';
import { ProductStatus } from '../../domain/entities/product.entity';

export class CreateProductDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  price?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  quantity?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  imageId?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateProductStatusDto {
  @IsEnum(ProductStatus)
  status!: ProductStatus;
}

export class ProductResponseDto {
  id!: string;
  name!: string;
  description?: string | null;
  price!: number;
  quantity!: number;
  status!: string;
  imageId?: string | null;
  imageUrl?: string | null;
  isFeatured!: boolean;
  sortOrder!: number;
  metadata?: Record<string, unknown> | null;
  restaurantId!: string;
  isVisible!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
