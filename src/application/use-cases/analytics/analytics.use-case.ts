// Analytics Use Case
import { Injectable, Inject } from '@nestjs/common';
import {
  IAnalyticsRepository,
  ANALYTICS_REPOSITORY,
  AnalyticsMetrics,
} from '../../../domain/repositories/analytics.repository.interface';
import { AnalyticsEventType } from '../../../domain/entities/analytics-event.entity';
import { IdempotencyService } from '../../../infrastructure/cache/idempotency.service';

export interface TrackEventDto {
  eventType: AnalyticsEventType;
  restaurantId: string;
  menuItemId?: string;
  metadata?: Record<string, unknown>;
}

export interface AnalyticsEventResponseDto {
  id: string;
  eventType: AnalyticsEventType;
  restaurantId: string;
  menuItemId?: string | null;
  createdAt: Date;
}

@Injectable()
export class AnalyticsUseCase {
  constructor(
    @Inject(ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: IAnalyticsRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Track an analytics event with idempotency
   * Frontend sends explicit events, backend validates and deduplicates
   */
  async trackEvent(
    dto: TrackEventDto,
    userId: string | null,
    idempotencyKey: string,
  ): Promise<AnalyticsEventResponseDto> {
    // Check idempotency first
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as AnalyticsEventResponseDto;
    }

    // Check if event already exists with this idempotency key
    const existingEvent =
      await this.analyticsRepository.findByIdempotencyKey(idempotencyKey);
    if (existingEvent) {
      return {
        id: existingEvent.id,
        eventType: existingEvent.eventType,
        restaurantId: existingEvent.restaurantId,
        menuItemId: existingEvent.menuItemId,
        createdAt: existingEvent.createdAt,
      };
    }

    // Create new event
    const event = await this.analyticsRepository.create({
      eventType: dto.eventType,
      restaurantId: dto.restaurantId,
      menuItemId: dto.menuItemId,
      userId,
      metadata: dto.metadata,
      idempotencyKey,
    });

    const response: AnalyticsEventResponseDto = {
      id: event.id,
      eventType: event.eventType,
      restaurantId: event.restaurantId,
      menuItemId: event.menuItemId,
      createdAt: event.createdAt,
    };

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 201, response);

    return response;
  }

  /**
   * Get restaurant metrics
   */
  async getRestaurantMetrics(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsMetrics> {
    return this.analyticsRepository.getRestaurantMetrics(
      restaurantId,
      startDate,
      endDate,
    );
  }

  /**
   * Get dish metrics
   */
  async getDishMetrics(
    menuItemId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ views: number; orders: number }> {
    return this.analyticsRepository.getDishMetrics(
      menuItemId,
      startDate,
      endDate,
    );
  }
}
