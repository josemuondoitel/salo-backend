// Analytics Controller - API v1
import { Controller, Post, Get, Body, Param, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import {
  AnalyticsUseCase,
  AnalyticsEventResponseDto,
} from '../../../application/use-cases/analytics/analytics.use-case';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { Public } from '../../decorators/public.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';
import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { AnalyticsEventType } from '../../../domain/entities/analytics-event.entity';
import { AnalyticsMetrics } from '../../../domain/repositories/analytics.repository.interface';

class TrackEventRequestDto {
  @IsEnum(AnalyticsEventType)
  eventType!: AnalyticsEventType;

  @IsString()
  restaurantId!: string;

  @IsOptional()
  @IsString()
  menuItemId?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

@Controller('api/v1/analytics')
export class AnalyticsController {
  constructor(private readonly analyticsUseCase: AnalyticsUseCase) {}

  /**
   * Track an analytics event
   * Public endpoint with idempotency
   * Frontend sends explicit events, backend validates and deduplicates
   */
  @Public()
  @Post('events')
  async trackEvent(
    @Body() dto: TrackEventRequestDto,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { user?: JwtPayload },
  ): Promise<AnalyticsEventResponseDto> {
    return this.analyticsUseCase.trackEvent(
      dto,
      req.user?.sub ?? null,
      idempotencyKey,
    );
  }

  /**
   * Get restaurant metrics
   * Restaurant owner only
   */
  @Get('restaurants/:restaurantId')
  @Roles('RESTAURANT_OWNER')
  async getRestaurantMetrics(
    @Param('restaurantId') restaurantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AnalyticsMetrics> {
    return this.analyticsUseCase.getRestaurantMetrics(
      restaurantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get dish metrics
   * Restaurant owner only
   */
  @Get('dishes/:menuItemId')
  @Roles('RESTAURANT_OWNER')
  async getDishMetrics(
    @Param('menuItemId') menuItemId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<{ views: number; orders: number }> {
    return this.analyticsUseCase.getDishMetrics(
      menuItemId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }
}
