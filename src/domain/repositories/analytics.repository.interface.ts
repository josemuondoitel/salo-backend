// Domain Repository Interface - Analytics
import {
  AnalyticsEvent,
  AnalyticsEventType,
} from '../entities/analytics-event.entity';

export interface CreateAnalyticsEventData {
  eventType: AnalyticsEventType;
  restaurantId: string;
  menuItemId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
  idempotencyKey: string;
}

export interface AnalyticsMetrics {
  dishViews: number;
  menuViews: number;
  ordersCreated: number;
  restaurantViews: number;
}

export interface IAnalyticsRepository {
  findByIdempotencyKey(idempotencyKey: string): Promise<AnalyticsEvent | null>;
  create(data: CreateAnalyticsEventData): Promise<AnalyticsEvent>;

  // Restaurant metrics
  getRestaurantMetrics(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsMetrics>;
  getDishMetrics(
    menuItemId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ views: number; orders: number }>;

  // Platform metrics (admin)
  getTotalEventsByType(
    eventType: AnalyticsEventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number>;
  getDailyEventCounts(
    eventType: AnalyticsEventType,
    days: number,
  ): Promise<{ date: string; count: number }[]>;
}

export const ANALYTICS_REPOSITORY = Symbol('ANALYTICS_REPOSITORY');
