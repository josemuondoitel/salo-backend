// Analytics Entity Tests
import { AnalyticsEvent, AnalyticsEventType } from './analytics-event.entity';

describe('AnalyticsEvent Entity', () => {
  describe('Event Creation', () => {
    it('should create a DISH_VIEWED event', () => {
      const event = new AnalyticsEvent({
        id: 'event-1',
        eventType: AnalyticsEventType.DISH_VIEWED,
        restaurantId: 'rest-1',
        menuItemId: 'dish-1',
        userId: 'user-1',
        metadata: { viewDuration: 5000 },
        idempotencyKey: 'idem-1',
        createdAt: new Date(),
      });

      expect(event.eventType).toBe(AnalyticsEventType.DISH_VIEWED);
      expect(event.restaurantId).toBe('rest-1');
      expect(event.menuItemId).toBe('dish-1');
    });

    it('should create a MENU_VIEWED event', () => {
      const event = new AnalyticsEvent({
        id: 'event-1',
        eventType: AnalyticsEventType.MENU_VIEWED,
        restaurantId: 'rest-1',
        idempotencyKey: 'idem-1',
        createdAt: new Date(),
      });

      expect(event.eventType).toBe(AnalyticsEventType.MENU_VIEWED);
      expect(event.menuItemId).toBeUndefined();
    });

    it('should create an ORDER_CREATED event', () => {
      const event = new AnalyticsEvent({
        id: 'event-1',
        eventType: AnalyticsEventType.ORDER_CREATED,
        restaurantId: 'rest-1',
        menuItemId: 'dish-1',
        userId: 'user-1',
        metadata: { orderId: 'order-1', amount: 5000 },
        idempotencyKey: 'idem-1',
        createdAt: new Date(),
      });

      expect(event.eventType).toBe(AnalyticsEventType.ORDER_CREATED);
      expect(event.metadata).toHaveProperty('orderId');
    });
  });

  describe('Idempotency', () => {
    it('should have an idempotency key for deduplication', () => {
      const event = new AnalyticsEvent({
        id: 'event-1',
        eventType: AnalyticsEventType.DISH_VIEWED,
        restaurantId: 'rest-1',
        idempotencyKey: 'unique-key-12345',
        createdAt: new Date(),
      });

      expect(event.idempotencyKey).toBe('unique-key-12345');
    });
  });
});
