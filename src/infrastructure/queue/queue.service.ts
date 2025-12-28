// Queue Service - BullMQ job scheduling
import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { v4 as uuidv4 } from 'uuid';
import {
  SUBSCRIPTION_EXPIRATION_QUEUE,
  SubscriptionExpirationJobData,
} from './subscription-expiration.processor';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(SUBSCRIPTION_EXPIRATION_QUEUE)
    private readonly subscriptionExpirationQueue: Queue<SubscriptionExpirationJobData>
  ) {}

  /**
   * Add a subscription expiration check job to the queue
   */
  async addSubscriptionExpirationJob(correlationId?: string): Promise<string> {
    const jobCorrelationId = correlationId || uuidv4();
    
    const job = await this.subscriptionExpirationQueue.add(
      'check-expiration',
      {
        triggeredAt: new Date().toISOString(),
        correlationId: jobCorrelationId,
      },
      {
        removeOnComplete: 100, // Keep last 100 completed jobs
        removeOnFail: 50, // Keep last 50 failed jobs
      }
    );

    this.logger.log(`Added subscription expiration job: ${job.id}`);
    return job.id ?? jobCorrelationId;
  }

  /**
   * Get queue stats
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    const [waiting, active, completed, failed] = await Promise.all([
      this.subscriptionExpirationQueue.getWaitingCount(),
      this.subscriptionExpirationQueue.getActiveCount(),
      this.subscriptionExpirationQueue.getCompletedCount(),
      this.subscriptionExpirationQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}
