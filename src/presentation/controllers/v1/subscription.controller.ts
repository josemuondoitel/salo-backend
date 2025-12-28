// Subscription Controller - API v1
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { SubscriptionUseCase } from '../../../application/use-cases/subscription/subscription.use-case';
import { CreateSubscriptionDto, SubscriptionResponseDto } from '../../../application/dtos/subscription.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';

@Controller('api/v1/subscriptions')
export class SubscriptionController {
  constructor(private readonly subscriptionUseCase: SubscriptionUseCase) {}

  /**
   * Create a new subscription for a restaurant
   * RESTAURANT_OWNER only
   * Requires idempotency key
   */
  @Post('restaurant/:restaurantId')
  @Roles('RESTAURANT_OWNER')
  async create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateSubscriptionDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() _idempotencyKey: string,
    @Req() req: Request & { correlationId?: string }
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionUseCase.create(restaurantId, dto, user.sub, req.correlationId);
  }

  /**
   * Get subscription by ID
   */
  @Get(':id')
  async findById(@Param('id') id: string): Promise<SubscriptionResponseDto | null> {
    return this.subscriptionUseCase.findById(id);
  }

  /**
   * Get active subscription for a restaurant
   */
  @Get('restaurant/:restaurantId/active')
  async findActiveByRestaurant(
    @Param('restaurantId') restaurantId: string
  ): Promise<SubscriptionResponseDto | null> {
    return this.subscriptionUseCase.findActiveByRestaurantId(restaurantId);
  }

  /**
   * Cancel subscription
   * RESTAURANT_OWNER or ADMIN
   */
  @Post(':id/cancel')
  @Roles('RESTAURANT_OWNER', 'ADMIN')
  @HttpCode(HttpStatus.OK)
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string }
  ): Promise<SubscriptionResponseDto> {
    return this.subscriptionUseCase.cancelSubscription(id, user.sub, req.correlationId);
  }
}
