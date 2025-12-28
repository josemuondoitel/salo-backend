// Subscription Expiration Job - BullMQ Processor
// This job runs daily to check for expired subscriptions and auto-suspend restaurants
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../../domain/repositories/subscription.repository.interface';
import {
  IRestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../domain/repositories/restaurant.repository.interface';
import {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
  AuditAction,
} from '../../domain/repositories/audit-log.repository.interface';
import { RestaurantStatus } from '../../domain/entities/restaurant.entity';

export const SUBSCRIPTION_EXPIRATION_QUEUE = 'subscription-expiration';

export interface SubscriptionExpirationJobData {
  triggeredAt: string;
  correlationId: string;
}

export interface SubscriptionExpirationResult {
  processedCount: number;
  expiredSubscriptions: string[];
  suspendedRestaurants: string[];
  errors: string[];
}

@Processor(SUBSCRIPTION_EXPIRATION_QUEUE)
export class SubscriptionExpirationProcessor extends WorkerHost {
  private readonly logger = new Logger(SubscriptionExpirationProcessor.name);

  constructor(
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
  ) {
    super();
  }

  /**
   * CRITICAL: Subscription Expiration Job
   *
   * This is a DETERMINISTIC job that:
   * 1. Finds all ACTIVE subscriptions with endDate <= now
   * 2. Marks them as EXPIRED
   * 3. Suspends the associated restaurants
   * 4. Creates audit logs for all actions
   *
   * This job MUST be:
   * - Idempotent (running multiple times produces same result)
   * - Auditable (all actions are logged)
   * - Deterministic (same input always produces same output)
   */
  async process(
    job: Job<SubscriptionExpirationJobData>,
  ): Promise<SubscriptionExpirationResult> {
    const correlationId = job.data.correlationId || uuidv4();

    this.logger.log(
      `Starting subscription expiration check. CorrelationId: ${correlationId}`,
    );

    const result: SubscriptionExpirationResult = {
      processedCount: 0,
      expiredSubscriptions: [],
      suspendedRestaurants: [],
      errors: [],
    };

    try {
      // Find all expired subscriptions (ACTIVE with endDate <= now)
      const expiredSubscriptions =
        await this.subscriptionRepository.findExpiredSubscriptions();

      this.logger.log(
        `Found ${expiredSubscriptions.length} expired subscriptions`,
      );

      for (const subscription of expiredSubscriptions) {
        try {
          result.processedCount++;

          // Get previous state for audit
          const previousSubscriptionState = subscription.toJSON();

          // Mark subscription as expired
          const expiredSubscription =
            await this.subscriptionRepository.markExpired(subscription.id);
          result.expiredSubscriptions.push(subscription.id);

          // Create audit log for subscription expiration
          await this.auditLogRepository.create({
            action: AuditAction.SUBSCRIPTION_EXPIRED,
            entityType: 'Subscription',
            entityId: subscription.id,
            previousState: previousSubscriptionState as unknown as Record<
              string,
              unknown
            >,
            newState: expiredSubscription.toJSON() as unknown as Record<
              string,
              unknown
            >,
            correlationId,
            metadata: {
              jobId: job.id,
              triggeredAt: job.data.triggeredAt,
              reason: 'AUTOMATIC_EXPIRATION',
            },
          });

          // AUTO-SUSPENSION: Suspend the restaurant
          const restaurant = await this.restaurantRepository.findById(
            subscription.restaurantId,
          );

          if (restaurant && restaurant.isActive()) {
            const previousRestaurantState = restaurant.toJSON();

            // Suspend restaurant - VISIBILITY becomes ZERO
            const suspendedRestaurant =
              await this.restaurantRepository.updateStatus(
                restaurant.id,
                RestaurantStatus.SUSPENDED,
              );
            result.suspendedRestaurants.push(restaurant.id);

            // Create audit log for restaurant suspension
            await this.auditLogRepository.create({
              action: AuditAction.RESTAURANT_SUSPENDED,
              entityType: 'Restaurant',
              entityId: restaurant.id,
              previousState: previousRestaurantState as unknown as Record<
                string,
                unknown
              >,
              newState: suspendedRestaurant.toJSON() as unknown as Record<
                string,
                unknown
              >,
              correlationId,
              metadata: {
                jobId: job.id,
                reason: 'SUBSCRIPTION_EXPIRED',
                subscriptionId: subscription.id,
                automaticSuspension: true,
              },
            });

            this.logger.log(
              `Restaurant ${restaurant.id} suspended due to subscription expiration. ` +
                `Previous status: ${restaurant.status}, New status: SUSPENDED`,
            );
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Unknown error';
          result.errors.push(
            `Subscription ${subscription.id}: ${errorMessage}`,
          );
          this.logger.error(
            `Error processing subscription ${subscription.id}: ${errorMessage}`,
          );
        }
      }

      this.logger.log(
        `Subscription expiration check completed. ` +
          `Processed: ${result.processedCount}, ` +
          `Expired: ${result.expiredSubscriptions.length}, ` +
          `Suspended: ${result.suspendedRestaurants.length}, ` +
          `Errors: ${result.errors.length}`,
      );

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to process subscription expiration job: ${errorMessage}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<SubscriptionExpirationJobData>): void {
    this.logger.log(`Job ${job.id} completed successfully`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<SubscriptionExpirationJobData>, error: Error): void {
    this.logger.error(`Job ${job.id} failed: ${error.message}`);
  }
}
