// Admin Analytics Controller - API v1
import { Controller, Get, Query } from '@nestjs/common';
import {
  AdminAnalyticsUseCase,
  PlatformStatsDto,
  RevenueProxyDto,
  GrowthMetricsDto,
  DailyOrdersDto,
} from '../../../application/use-cases/admin-analytics/admin-analytics.use-case';
import { Roles } from '../../decorators/roles.decorator';

@Controller('api/v1/admin/analytics')
@Roles('ADMIN')
export class AdminAnalyticsController {
  constructor(private readonly adminAnalyticsUseCase: AdminAnalyticsUseCase) {}

  /**
   * Get platform-wide statistics
   * ADMIN ONLY - Read-only
   */
  @Get('platform-stats')
  async getPlatformStats(): Promise<PlatformStatsDto> {
    return this.adminAnalyticsUseCase.getPlatformStats();
  }

  /**
   * Get revenue proxy metrics
   * ADMIN ONLY - Read-only
   */
  @Get('revenue')
  async getRevenueProxy(): Promise<RevenueProxyDto> {
    return this.adminAnalyticsUseCase.getRevenueProxy();
  }

  /**
   * Get growth metrics
   * ADMIN ONLY - Read-only
   */
  @Get('growth')
  async getGrowthMetrics(): Promise<GrowthMetricsDto> {
    return this.adminAnalyticsUseCase.getGrowthMetrics();
  }

  /**
   * Get daily order counts
   * ADMIN ONLY - Read-only
   */
  @Get('daily-orders')
  async getDailyOrders(
    @Query('days') days?: string,
  ): Promise<DailyOrdersDto[]> {
    const numDays = days ? parseInt(days, 10) : 30;
    return this.adminAnalyticsUseCase.getDailyOrders(numDays);
  }
}
