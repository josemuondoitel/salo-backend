// Restaurant DTOs
import { IsString, IsOptional, MinLength } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(5)
  address!: string;

  @IsString()
  @MinLength(9)
  phone!: string;
}

export class UpdateRestaurantDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;

  @IsOptional()
  @IsString()
  @MinLength(9)
  phone?: string;
}

export class RestaurantResponseDto {
  id!: string;
  name!: string;
  description?: string | null;
  address!: string;
  phone!: string;
  status!: string;
  visibility!: number;
  isVisible!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
