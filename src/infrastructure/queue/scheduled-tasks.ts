// Scheduled Tasks - Cron jobs for subscription expiration
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { QueueService } from './queue.service';

@Injectable()
export class ScheduledTasks {
  private readonly logger = new Logger(ScheduledTasks.name);

  constructor(private readonly queueService: QueueService) {}

  /**
   * SUBSCRIPTION EXPIRATION CRON JOB
   *
   * Runs daily at midnight to check for expired subscriptions.
   * This triggers the BullMQ job that processes all expired subscriptions
   * and auto-suspends restaurants.
   *
   * Cron: 0 0 * * * = every day at midnight
   */
  @Cron('0 0 * * *', { name: 'subscription-expiration-check' })
  async handleSubscriptionExpiration(): Promise<void> {
    this.logger.log('Starting daily subscription expiration check');

    try {
      const jobId = await this.queueService.addSubscriptionExpirationJob();
      this.logger.log(`Subscription expiration job queued: ${jobId}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(
        `Failed to queue subscription expiration job: ${message}`,
      );
    }
  }
}
