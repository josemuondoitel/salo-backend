// Subscription Use Cases
import { Injectable, Inject, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/repositories/subscription.repository.interface';
import {
  IRestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository.interface';
import {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
  AuditAction,
} from '../../../domain/repositories/audit-log.repository.interface';
import { CreateSubscriptionDto, SubscriptionResponseDto } from '../../dtos/subscription.dto';
import { Subscription } from '../../../domain/entities/subscription.entity';
import { RestaurantStatus } from '../../../domain/entities/restaurant.entity';

@Injectable()
export class SubscriptionUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly configService: ConfigService
  ) {}

  /**
   * Create a new subscription for a restaurant
   * This is a pending subscription that requires payment validation
   */
  async create(
    restaurantId: string,
    dto: CreateSubscriptionDto,
    ownerId: string,
    correlationId?: string
  ): Promise<SubscriptionResponseDto> {
    // Verify restaurant ownership
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to create subscription for this restaurant');
    }

    // Check for existing active subscription
    const existingSubscription = await this.subscriptionRepository.findActiveByRestaurantId(restaurantId);
    if (existingSubscription && existingSubscription.isValid()) {
      throw new BadRequestException('Restaurant already has an active subscription');
    }

    const subscription = await this.subscriptionRepository.create({
      restaurantId,
      monthlyAmount: dto.monthlyAmount,
    });

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.SUBSCRIPTION_CREATED,
      entityType: 'Subscription',
      entityId: subscription.id,
      newState: subscription.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        paymentMethod: dto.paymentMethod,
        paymentReference: dto.paymentReference,
      },
    });

    return this.toResponseDto(subscription);
  }

  /**
   * Activate a subscription after payment validation (ADMIN ONLY)
   * This is a critical action that requires idempotency
   */
  async activateSubscription(
    subscriptionId: string,
    adminId: string,
    correlationId?: string
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    if (subscription.isActive()) {
      throw new BadRequestException('Subscription is already active');
    }

    const previousState = subscription.toJSON();

    // Calculate subscription period (1 month from now)
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    // Activate subscription
    const activatedSubscription = await this.subscriptionRepository.activate(
      subscriptionId,
      startDate,
      endDate
    );

    // Activate restaurant
    const restaurant = await this.restaurantRepository.findById(subscription.restaurantId);
    if (restaurant) {
      const previousRestaurantState = restaurant.toJSON();
      
      await this.restaurantRepository.updateStatus(
        restaurant.id,
        RestaurantStatus.ACTIVE
      );

      // Audit log for restaurant activation
      await this.auditLogRepository.create({
        action: AuditAction.RESTAURANT_ACTIVATED,
        entityType: 'Restaurant',
        entityId: restaurant.id,
        previousState: previousRestaurantState as unknown as Record<string, unknown>,
        newState: { ...previousRestaurantState, status: RestaurantStatus.ACTIVE },
        correlationId: correlationId || uuidv4(),
        userId: adminId,
        metadata: {
          subscriptionId,
          activatedBy: 'ADMIN',
        },
      });
    }

    // Audit log for subscription activation
    await this.auditLogRepository.create({
      action: AuditAction.SUBSCRIPTION_ACTIVATED,
      entityType: 'Subscription',
      entityId: subscriptionId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: activatedSubscription.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: adminId,
      metadata: {
        activatedBy: 'ADMIN',
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });

    return this.toResponseDto(activatedSubscription);
  }

  /**
   * Get subscription by ID
   */
  async findById(subscriptionId: string): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    return subscription ? this.toResponseDto(subscription) : null;
  }

  /**
   * Get active subscription for a restaurant
   */
  async findActiveByRestaurantId(restaurantId: string): Promise<SubscriptionResponseDto | null> {
    const subscription = await this.subscriptionRepository.findActiveByRestaurantId(restaurantId);
    return subscription ? this.toResponseDto(subscription) : null;
  }

  /**
   * Cancel subscription (ADMIN or OWNER)
   */
  async cancelSubscription(
    subscriptionId: string,
    userId: string,
    correlationId?: string
  ): Promise<SubscriptionResponseDto> {
    const subscription = await this.subscriptionRepository.findById(subscriptionId);
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const previousState = subscription.toJSON();

    const cancelledSubscription = await this.subscriptionRepository.cancel(subscriptionId);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.SUBSCRIPTION_CANCELLED,
      entityType: 'Subscription',
      entityId: subscriptionId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: cancelledSubscription.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId,
    });

    return this.toResponseDto(cancelledSubscription);
  }

  private toResponseDto(subscription: Subscription): SubscriptionResponseDto {
    return {
      id: subscription.id,
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate,
      monthlyAmount: subscription.monthlyAmount,
      restaurantId: subscription.restaurantId,
      daysRemaining: subscription.daysRemaining(),
      isValid: subscription.isValid(),
      createdAt: subscription.createdAt,
      updatedAt: subscription.updatedAt,
    };
  }
}
