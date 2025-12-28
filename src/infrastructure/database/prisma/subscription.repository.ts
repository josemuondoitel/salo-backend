// Subscription Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { ISubscriptionRepository, CreateSubscriptionData } from '../../../domain/repositories/subscription.repository.interface';
import { Subscription, SubscriptionStatus } from '../../../domain/entities/subscription.entity';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaSubscriptionRepository implements ISubscriptionRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: string;
    status: string;
    startDate: Date | null;
    endDate: Date | null;
    monthlyAmount: Prisma.Decimal;
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Subscription {
    return new Subscription({
      id: data.id,
      status: data.status as SubscriptionStatus,
      startDate: data.startDate,
      endDate: data.endDate,
      monthlyAmount: data.monthlyAmount.toNumber(),
      restaurantId: data.restaurantId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findUnique({ where: { id } });
    return subscription ? this.toDomain(subscription) : null;
  }

  async findByRestaurantId(restaurantId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: { restaurantId },
      orderBy: { createdAt: 'desc' },
    });
    return subscription ? this.toDomain(subscription) : null;
  }

  async findActiveByRestaurantId(restaurantId: string): Promise<Subscription | null> {
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        restaurantId,
        status: SubscriptionStatus.ACTIVE,
      },
      orderBy: { createdAt: 'desc' },
    });
    return subscription ? this.toDomain(subscription) : null;
  }

  /**
   * CRITICAL: Find all expired subscriptions for the expiration job
   * Deterministic query: finds ACTIVE subscriptions where endDate < now
   */
  async findExpiredSubscriptions(): Promise<Subscription[]> {
    const now = new Date();
    
    const subscriptions = await this.prisma.subscription.findMany({
      where: {
        status: SubscriptionStatus.ACTIVE,
        endDate: { lte: now },
      },
    });
    
    return subscriptions.map((s) => this.toDomain(s));
  }

  async findByStatus(status: SubscriptionStatus): Promise<Subscription[]> {
    const subscriptions = await this.prisma.subscription.findMany({
      where: { status },
    });
    return subscriptions.map((s) => this.toDomain(s));
  }

  async create(data: CreateSubscriptionData): Promise<Subscription> {
    const subscription = await this.prisma.subscription.create({
      data: {
        restaurantId: data.restaurantId,
        monthlyAmount: data.monthlyAmount,
        status: SubscriptionStatus.PENDING,
      },
    });
    return this.toDomain(subscription);
  }

  async activate(id: string, startDate: Date, endDate: Date): Promise<Subscription> {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
    });
    return this.toDomain(subscription);
  }

  async markExpired(id: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.EXPIRED },
    });
    return this.toDomain(subscription);
  }

  async cancel(id: string): Promise<Subscription> {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED },
    });
    return this.toDomain(subscription);
  }

  async updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription> {
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(subscription);
  }
}
