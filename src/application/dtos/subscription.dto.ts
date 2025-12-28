// Subscription DTOs
import { IsNumber, IsPositive, IsEnum, IsOptional, IsString } from 'class-validator';

export enum PaymentMethodDto {
  EXPRESS = 'EXPRESS',
  TRANSFER = 'TRANSFER',
}

export class CreateSubscriptionDto {
  @IsNumber()
  @IsPositive()
  monthlyAmount!: number;

  @IsEnum(PaymentMethodDto)
  paymentMethod!: PaymentMethodDto;

  @IsOptional()
  @IsString()
  paymentReference?: string;
}

export class ValidatePaymentDto {
  @IsString()
  subscriptionId!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SubscriptionResponseDto {
  id!: string;
  status!: string;
  startDate?: Date | null;
  endDate?: Date | null;
  monthlyAmount!: number;
  restaurantId!: string;
  daysRemaining!: number;
  isValid!: boolean;
  createdAt!: Date;
  updatedAt!: Date;
}
