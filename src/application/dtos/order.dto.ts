// Order DTOs
import { IsString, IsArray, IsNumber, IsOptional, IsPositive, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsString()
  menuItemId!: string;

  @IsNumber()
  @IsPositive()
  @Min(1)
  quantity!: number;
}

export class CreateOrderDto {
  @IsString()
  restaurantId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items!: OrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateOrderStatusDto {
  @IsString()
  status!: string;
}

export class OrderResponseDto {
  id!: string;
  status!: string;
  totalAmount!: number;
  notes?: string | null;
  customerId!: string;
  restaurantId!: string;
  items!: {
    id: string;
    menuItemId: string;
    quantity: number;
    unitPrice: number;
  }[];
  createdAt!: Date;
  updatedAt!: Date;
}
