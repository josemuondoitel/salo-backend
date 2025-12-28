// Domain Repository Interface - Subscription
import { Subscription, SubscriptionStatus } from '../entities/subscription.entity';

export interface CreateSubscriptionData {
  restaurantId: string;
  monthlyAmount: number;
}

export interface ISubscriptionRepository {
  findById(id: string): Promise<Subscription | null>;
  findByRestaurantId(restaurantId: string): Promise<Subscription | null>;
  findActiveByRestaurantId(restaurantId: string): Promise<Subscription | null>;
  
  /**
   * Find all expired subscriptions that need processing
   * Used by the subscription expiration job
   */
  findExpiredSubscriptions(): Promise<Subscription[]>;
  
  /**
   * Find subscriptions by status
   */
  findByStatus(status: SubscriptionStatus): Promise<Subscription[]>;
  
  create(data: CreateSubscriptionData): Promise<Subscription>;
  
  /**
   * Activate subscription with payment validation
   */
  activate(id: string, startDate: Date, endDate: Date): Promise<Subscription>;
  
  /**
   * Mark subscription as expired
   */
  markExpired(id: string): Promise<Subscription>;
  
  /**
   * Cancel subscription
   */
  cancel(id: string): Promise<Subscription>;
  
  updateStatus(id: string, status: SubscriptionStatus): Promise<Subscription>;
}

export const SUBSCRIPTION_REPOSITORY = Symbol('SUBSCRIPTION_REPOSITORY');
