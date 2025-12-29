// Admin Analytics Use Case - Platform-wide analytics
import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';
import {
  IAnalyticsRepository,
  ANALYTICS_REPOSITORY,
} from '../../../domain/repositories/analytics.repository.interface';
import { AnalyticsEventType } from '../../../domain/entities/analytics-event.entity';
import { RestaurantStatus } from '../../../domain/entities/restaurant.entity';
import { SubscriptionStatus } from '../../../domain/entities/subscription.entity';

export interface PlatformStatsDto {
  restaurants: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
  };
  subscriptions: {
    active: number;
    expired: number;
    pending: number;
    cancelled: number;
  };
  orders: {
    total: number;
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  users: {
    total: number;
    customers: number;
    restaurantOwners: number;
  };
}

export interface RevenueProxyDto {
  activeSubscriptions: number;
  monthlyRecurringRevenue: number;
  estimatedAnnualRevenue: number;
}

export interface GrowthMetricsDto {
  newRestaurantsLastWeek: number;
  newUsersLastWeek: number;
  ordersGrowthPercent: number;
}

export interface DailyOrdersDto {
  date: string;
  count: number;
}

@Injectable()
export class AdminAnalyticsUseCase {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ANALYTICS_REPOSITORY)
    private readonly analyticsRepository: IAnalyticsRepository,
  ) {}

  /**
   * Get platform-wide statistics
   * Read-only, optimized queries
   */
  async getPlatformStats(): Promise<PlatformStatsDto> {
    const [
      totalRestaurants,
      activeRestaurants,
      suspendedRestaurants,
      pendingRestaurants,
      activeSubscriptions,
      expiredSubscriptions,
      pendingSubscriptions,
      cancelledSubscriptions,
      totalOrders,
      todayOrders,
      weekOrders,
      monthOrders,
      totalUsers,
      customers,
      restaurantOwners,
    ] = await Promise.all([
      this.prisma.restaurant.count(),
      this.prisma.restaurant.count({
        where: { status: RestaurantStatus.ACTIVE },
      }),
      this.prisma.restaurant.count({
        where: { status: RestaurantStatus.SUSPENDED },
      }),
      this.prisma.restaurant.count({
        where: { status: RestaurantStatus.PENDING },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.ACTIVE },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.EXPIRED },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.PENDING },
      }),
      this.prisma.subscription.count({
        where: { status: SubscriptionStatus.CANCELLED },
      }),
      this.prisma.order.count(),
      this.prisma.order.count({
        where: { createdAt: { gte: this.startOfDay() } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: this.startOfWeek() } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: this.startOfMonth() } },
      }),
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.prisma.user.count({ where: { role: 'RESTAURANT_OWNER' } }),
    ]);

    return {
      restaurants: {
        total: totalRestaurants,
        active: activeRestaurants,
        suspended: suspendedRestaurants,
        pending: pendingRestaurants,
      },
      subscriptions: {
        active: activeSubscriptions,
        expired: expiredSubscriptions,
        pending: pendingSubscriptions,
        cancelled: cancelledSubscriptions,
      },
      orders: {
        total: totalOrders,
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
      },
      users: {
        total: totalUsers,
        customers,
        restaurantOwners,
      },
    };
  }

  /**
   * Get revenue proxy metrics
   * Based on subscription counts
   */
  async getRevenueProxy(): Promise<RevenueProxyDto> {
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { status: SubscriptionStatus.ACTIVE },
    });

    // Get average monthly amount from active subscriptions
    const result = await this.prisma.subscription.aggregate({
      where: { status: SubscriptionStatus.ACTIVE },
      _avg: { monthlyAmount: true },
    });

    const avgMonthlyAmount = result._avg.monthlyAmount?.toNumber() ?? 0;
    const monthlyRecurringRevenue = activeSubscriptions * avgMonthlyAmount;
    const estimatedAnnualRevenue = monthlyRecurringRevenue * 12;

    return {
      activeSubscriptions,
      monthlyRecurringRevenue,
      estimatedAnnualRevenue,
    };
  }

  /**
   * Get platform growth metrics
   */
  async getGrowthMetrics(): Promise<GrowthMetricsDto> {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const [
      newRestaurantsLastWeek,
      newUsersLastWeek,
      ordersLastWeek,
      ordersTwoWeeksAgo,
    ] = await Promise.all([
      this.prisma.restaurant.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      this.prisma.user.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: lastWeek } },
      }),
      this.prisma.order.count({
        where: { createdAt: { gte: twoWeeksAgo, lt: lastWeek } },
      }),
    ]);

    const ordersGrowthPercent =
      ordersTwoWeeksAgo > 0
        ? ((ordersLastWeek - ordersTwoWeeksAgo) / ordersTwoWeeksAgo) * 100
        : 0;

    return {
      newRestaurantsLastWeek,
      newUsersLastWeek,
      ordersGrowthPercent: Math.round(ordersGrowthPercent * 100) / 100,
    };
  }

  /**
   * Get daily order counts for the last N days
   */
  async getDailyOrders(days: number): Promise<DailyOrdersDto[]> {
    return this.analyticsRepository.getDailyEventCounts(
      AnalyticsEventType.ORDER_CREATED,
      days,
    );
  }

  private startOfDay(): Date {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private startOfWeek(): Date {
    const date = new Date();
    const day = date.getDay();
    date.setDate(date.getDate() - day);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private startOfMonth(): Date {
    const date = new Date();
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
  }
}
