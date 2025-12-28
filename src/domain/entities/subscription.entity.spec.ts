// Unit Tests - Subscription Entity
import { Subscription, SubscriptionStatus } from '../../domain/entities/subscription.entity';

describe('Subscription Entity', () => {
  const createSubscription = (overrides: Partial<{
    id: string;
    status: SubscriptionStatus;
    startDate: Date | null;
    endDate: Date | null;
    monthlyAmount: number;
    restaurantId: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {}): Subscription => {
    return new Subscription({
      id: 'sub-123',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-01'),
      monthlyAmount: 5000,
      restaurantId: 'rest-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('isValid', () => {
    it('should return true for active subscription with future end date', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const subscription = createSubscription({
        status: SubscriptionStatus.ACTIVE,
        endDate: futureDate,
      });

      expect(subscription.isValid()).toBe(true);
    });

    it('should return false for active subscription with past end date', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      
      const subscription = createSubscription({
        status: SubscriptionStatus.ACTIVE,
        endDate: pastDate,
      });

      expect(subscription.isValid()).toBe(false);
    });

    it('should return false for expired subscription', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.EXPIRED,
      });

      expect(subscription.isValid()).toBe(false);
    });

    it('should return false for pending subscription', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.PENDING,
      });

      expect(subscription.isValid()).toBe(false);
    });

    it('should return false for cancelled subscription', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.CANCELLED,
      });

      expect(subscription.isValid()).toBe(false);
    });

    it('should return false when end date is null', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.ACTIVE,
        endDate: null,
      });

      expect(subscription.isValid()).toBe(false);
    });
  });

  describe('isExpired', () => {
    it('should return true when end date is in the past', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      
      const subscription = createSubscription({
        endDate: pastDate,
      });

      expect(subscription.isExpired()).toBe(true);
    });

    it('should return false when end date is in the future', () => {
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 1);
      
      const subscription = createSubscription({
        endDate: futureDate,
      });

      expect(subscription.isExpired()).toBe(false);
    });

    it('should return true when status is EXPIRED', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.EXPIRED,
        endDate: null,
      });

      expect(subscription.isExpired()).toBe(true);
    });
  });

  describe('daysRemaining', () => {
    it('should return 0 when subscription has no end date', () => {
      const subscription = createSubscription({
        endDate: null,
      });

      expect(subscription.daysRemaining()).toBe(0);
    });

    it('should return 0 when subscription is expired', () => {
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      
      const subscription = createSubscription({
        endDate: pastDate,
      });

      expect(subscription.daysRemaining()).toBe(0);
    });

    it('should return positive number for active subscription', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 15);
      
      const subscription = createSubscription({
        endDate: futureDate,
      });

      expect(subscription.daysRemaining()).toBeGreaterThan(0);
      expect(subscription.daysRemaining()).toBeLessThanOrEqual(16);
    });
  });

  describe('expire', () => {
    it('should return new subscription with EXPIRED status', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.ACTIVE,
      });

      const expired = subscription.expire();

      expect(expired.status).toBe(SubscriptionStatus.EXPIRED);
      expect(subscription.status).toBe(SubscriptionStatus.ACTIVE); // Original unchanged
    });
  });

  describe('activate', () => {
    it('should return new subscription with ACTIVE status and dates', () => {
      const subscription = createSubscription({
        status: SubscriptionStatus.PENDING,
        startDate: null,
        endDate: null,
      });

      const startDate = new Date();
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      const activated = subscription.activate(startDate, endDate);

      expect(activated.status).toBe(SubscriptionStatus.ACTIVE);
      expect(activated.startDate).toBe(startDate);
      expect(activated.endDate).toBe(endDate);
      expect(subscription.status).toBe(SubscriptionStatus.PENDING); // Original unchanged
    });
  });
});
