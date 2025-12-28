// Analytics Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from './prisma.service';
import {
  IAnalyticsRepository,
  CreateAnalyticsEventData,
  AnalyticsMetrics,
} from '../../../domain/repositories/analytics.repository.interface';
import {
  AnalyticsEvent,
  AnalyticsEventType,
} from '../../../domain/entities/analytics-event.entity';

@Injectable()
export class PrismaAnalyticsRepository implements IAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: string;
    eventType: string;
    restaurantId: string;
    menuItemId: string | null;
    userId: string | null;
    metadata: Prisma.JsonValue;
    idempotencyKey: string;
    createdAt: Date;
  }): AnalyticsEvent {
    return new AnalyticsEvent({
      id: data.id,
      eventType: data.eventType as AnalyticsEventType,
      restaurantId: data.restaurantId,
      menuItemId: data.menuItemId,
      userId: data.userId,
      metadata: data.metadata as Record<string, unknown> | null,
      idempotencyKey: data.idempotencyKey,
      createdAt: data.createdAt,
    });
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<AnalyticsEvent | null> {
    const event = await this.prisma.analyticsEvent.findUnique({
      where: { idempotencyKey },
    });
    return event ? this.toDomain(event) : null;
  }

  async create(data: CreateAnalyticsEventData): Promise<AnalyticsEvent> {
    const event = await this.prisma.analyticsEvent.create({
      data: {
        eventType: data.eventType,
        restaurantId: data.restaurantId,
        menuItemId: data.menuItemId ?? null,
        userId: data.userId ?? null,
        metadata: (data.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull,
        idempotencyKey: data.idempotencyKey,
      },
    });
    return this.toDomain(event);
  }

  async getRestaurantMetrics(
    restaurantId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<AnalyticsMetrics> {
    const whereClause: Prisma.AnalyticsEventWhereInput = {
      restaurantId,
      ...(startDate && endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : {}),
    };

    const [dishViews, menuViews, ordersCreated, restaurantViews] =
      await Promise.all([
        this.prisma.analyticsEvent.count({
          where: { ...whereClause, eventType: AnalyticsEventType.DISH_VIEWED },
        }),
        this.prisma.analyticsEvent.count({
          where: { ...whereClause, eventType: AnalyticsEventType.MENU_VIEWED },
        }),
        this.prisma.analyticsEvent.count({
          where: {
            ...whereClause,
            eventType: AnalyticsEventType.ORDER_CREATED,
          },
        }),
        this.prisma.analyticsEvent.count({
          where: {
            ...whereClause,
            eventType: AnalyticsEventType.RESTAURANT_VIEWED,
          },
        }),
      ]);

    return { dishViews, menuViews, ordersCreated, restaurantViews };
  }

  async getDishMetrics(
    menuItemId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<{ views: number; orders: number }> {
    const whereClause: Prisma.AnalyticsEventWhereInput = {
      menuItemId,
      ...(startDate && endDate
        ? { createdAt: { gte: startDate, lte: endDate } }
        : {}),
    };

    const [views, orders] = await Promise.all([
      this.prisma.analyticsEvent.count({
        where: { ...whereClause, eventType: AnalyticsEventType.DISH_VIEWED },
      }),
      this.prisma.analyticsEvent.count({
        where: { ...whereClause, eventType: AnalyticsEventType.ORDER_CREATED },
      }),
    ]);

    return { views, orders };
  }

  async getTotalEventsByType(
    eventType: AnalyticsEventType,
    startDate?: Date,
    endDate?: Date,
  ): Promise<number> {
    return this.prisma.analyticsEvent.count({
      where: {
        eventType,
        ...(startDate && endDate
          ? { createdAt: { gte: startDate, lte: endDate } }
          : {}),
      },
    });
  }

  async getDailyEventCounts(
    eventType: AnalyticsEventType,
    days: number,
  ): Promise<{ date: string; count: number }[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const events = await this.prisma.analyticsEvent.groupBy({
      by: ['createdAt'],
      where: {
        eventType,
        createdAt: { gte: startDate },
      },
      _count: true,
    });

    // Group by date
    const dailyCounts = new Map<string, number>();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      dailyCounts.set(date.toISOString().split('T')[0], 0);
    }

    for (const event of events) {
      const dateStr = event.createdAt.toISOString().split('T')[0];
      const current = dailyCounts.get(dateStr) ?? 0;
      dailyCounts.set(dateStr, current + event._count);
    }

    return Array.from(dailyCounts.entries()).map(([date, count]) => ({
      date,
      count,
    }));
  }
}
