// Admin Use Cases
import { Injectable, Inject, NotFoundException } from '@nestjs/common';
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
import { SubscriptionUseCase } from '../subscription/subscription.use-case';
import { RestaurantStatus } from '../../../domain/entities/restaurant.entity';
import { QueueService } from '../../../infrastructure/queue/queue.service';

@Injectable()
export class AdminUseCase {
  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly subscriptionUseCase: SubscriptionUseCase,
    private readonly queueService: QueueService,
  ) {}

  /**
   * Validate payment and activate subscription
   * ADMIN ONLY - Requires idempotency
   */
  async validatePayment(
    subscriptionId: string,
    adminId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<{
    subscription: { id: string; status: string };
    restaurant: { id: string; status: string };
  }> {
    const subscription = await this.subscriptionUseCase.activateSubscription(
      subscriptionId,
      adminId,
      correlationId || uuidv4(),
    );

    const restaurant = await this.restaurantRepository.findById(
      subscription.restaurantId,
    );

    // Audit log for admin action
    await this.auditLogRepository.create({
      action: AuditAction.PAYMENT_VALIDATED,
      entityType: 'Subscription',
      entityId: subscriptionId,
      correlationId: correlationId || uuidv4(),
      userId: adminId,
      metadata: {
        idempotencyKey,
        action: 'PAYMENT_VALIDATION',
      },
    });

    return {
      subscription: { id: subscription.id, status: subscription.status },
      restaurant: {
        id: restaurant?.id || '',
        status: restaurant?.status || '',
      },
    };
  }

  /**
   * Manually suspend a restaurant
   * ADMIN ONLY
   */
  async suspendRestaurant(
    restaurantId: string,
    adminId: string,
    reason: string,
    correlationId?: string,
  ): Promise<{ id: string; status: string }> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    const previousState = restaurant.toJSON();

    const suspended = await this.restaurantRepository.updateStatus(
      restaurantId,
      RestaurantStatus.SUSPENDED,
    );

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.RESTAURANT_SUSPENDED,
      entityType: 'Restaurant',
      entityId: restaurantId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: suspended.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: adminId,
      metadata: {
        reason,
        manualSuspension: true,
        suspendedBy: adminId,
      },
    });

    return { id: suspended.id, status: suspended.status };
  }

  /**
   * Manually trigger subscription expiration check
   * ADMIN ONLY
   */
  async triggerExpirationCheck(
    adminId: string,
    correlationId?: string,
  ): Promise<{ jobId: string }> {
    const jobCorrelationId = correlationId || uuidv4();

    const jobId =
      await this.queueService.addSubscriptionExpirationJob(jobCorrelationId);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ADMIN_ACTION,
      entityType: 'System',
      entityId: 'subscription-expiration-job',
      correlationId: jobCorrelationId,
      userId: adminId,
      metadata: {
        action: 'MANUAL_EXPIRATION_CHECK',
        jobId,
      },
    });

    return { jobId };
  }

  /**
   * Get audit logs by entity
   */
  async getAuditLogs(
    entityType: string,
    entityId: string,
  ): Promise<
    {
      action: string;
      entityType: string;
      entityId: string;
      createdAt: Date;
      userId: string | null;
    }[]
  > {
    const logs = await this.auditLogRepository.findByEntityId(
      entityType,
      entityId,
    );
    return logs.map((log) => ({
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      createdAt: log.createdAt,
      userId: log.userId ?? null,
    }));
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    return this.queueService.getQueueStats();
  }
}
