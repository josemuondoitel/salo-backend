// Order Entity Tests - State Transitions
import { Order, OrderStatus } from './order.entity';

describe('Order Entity - State Transitions', () => {
  const createOrder = (
    overrides: Partial<{
      id: string;
      status: OrderStatus;
      totalAmount: number;
      notes: string | null;
      idempotencyKey: string;
      customerId: string;
      restaurantId: string;
      items: {
        id: string;
        quantity: number;
        unitPrice: number;
        menuItemId: string;
      }[];
      rejectionReason: string | null;
      reportReason: string | null;
      cancellationReason: string | null;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ): Order => {
    return new Order({
      id: 'order-1',
      status: OrderStatus.PENDING,
      totalAmount: 100.0,
      notes: null,
      idempotencyKey: 'test-key-123',
      customerId: 'customer-1',
      restaurantId: 'restaurant-1',
      items: [
        { id: 'item-1', quantity: 2, unitPrice: 50.0, menuItemId: 'menu-1' },
      ],
      rejectionReason: null,
      reportReason: null,
      cancellationReason: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('Basic Properties', () => {
    it('should create an order with all properties', () => {
      const order = createOrder();

      expect(order.id).toBe('order-1');
      expect(order.status).toBe(OrderStatus.PENDING);
      expect(order.totalAmount).toBe(100.0);
      expect(order.customerId).toBe('customer-1');
      expect(order.restaurantId).toBe('restaurant-1');
      expect(order.items).toHaveLength(1);
    });
  });

  describe('Status Checks', () => {
    it('should identify pending order', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.isPending()).toBe(true);
      expect(order.isAccepted()).toBe(false);
    });

    it('should identify accepted order', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      expect(order.isPending()).toBe(false);
      expect(order.isAccepted()).toBe(true);
    });

    it('should identify rejected order', () => {
      const order = createOrder({ status: OrderStatus.REJECTED });
      expect(order.isRejected()).toBe(true);
    });

    it('should identify cancelled order', () => {
      const order = createOrder({ status: OrderStatus.CANCELLED });
      expect(order.isCancelled()).toBe(true);
    });

    it('should identify delivered order', () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });
      expect(order.isDelivered()).toBe(true);
    });

    it('should identify reported order', () => {
      const order = createOrder({ status: OrderStatus.REPORTED });
      expect(order.isReported()).toBe(true);
    });
  });

  describe('Valid State Transitions from PENDING', () => {
    it('can transition to ACCEPTED', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canTransitionTo(OrderStatus.ACCEPTED)).toBe(true);
      expect(order.canBeAccepted()).toBe(true);
    });

    it('can transition to REJECTED', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canTransitionTo(OrderStatus.REJECTED)).toBe(true);
      expect(order.canBeRejected()).toBe(true);
    });

    it('can transition to CANCELLED', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canTransitionTo(OrderStatus.CANCELLED)).toBe(true);
      expect(order.canBeCancelled()).toBe(true);
    });

    it('cannot transition directly to CONFIRMED', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canTransitionTo(OrderStatus.CONFIRMED)).toBe(false);
    });

    it('cannot transition directly to PREPARING', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canTransitionTo(OrderStatus.PREPARING)).toBe(false);
    });

    it('cannot transition directly to DELIVERED', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      expect(order.canTransitionTo(OrderStatus.DELIVERED)).toBe(false);
    });
  });

  describe('Valid State Transitions from ACCEPTED', () => {
    it('can transition to CONFIRMED', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      expect(order.canTransitionTo(OrderStatus.CONFIRMED)).toBe(true);
    });

    it('can transition to CANCELLED', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      expect(order.canBeCancelled()).toBe(true);
    });

    it('can transition to REPORTED', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      expect(order.canBeReported()).toBe(true);
    });

    it('cannot transition back to PENDING', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      expect(order.canTransitionTo(OrderStatus.PENDING)).toBe(false);
    });
  });

  describe('Valid State Transitions from CONFIRMED', () => {
    it('can transition to PREPARING', () => {
      const order = createOrder({ status: OrderStatus.CONFIRMED });
      expect(order.canTransitionTo(OrderStatus.PREPARING)).toBe(true);
    });

    it('can transition to CANCELLED', () => {
      const order = createOrder({ status: OrderStatus.CONFIRMED });
      expect(order.canBeCancelled()).toBe(true);
    });

    it('can transition to REPORTED', () => {
      const order = createOrder({ status: OrderStatus.CONFIRMED });
      expect(order.canBeReported()).toBe(true);
    });
  });

  describe('Valid State Transitions from PREPARING', () => {
    it('can transition to READY', () => {
      const order = createOrder({ status: OrderStatus.PREPARING });
      expect(order.canTransitionTo(OrderStatus.READY)).toBe(true);
    });

    it('can transition to CANCELLED', () => {
      const order = createOrder({ status: OrderStatus.PREPARING });
      expect(order.canBeCancelled()).toBe(true);
    });

    it('can transition to REPORTED', () => {
      const order = createOrder({ status: OrderStatus.PREPARING });
      expect(order.canBeReported()).toBe(true);
    });
  });

  describe('Valid State Transitions from READY', () => {
    it('can transition to DELIVERED', () => {
      const order = createOrder({ status: OrderStatus.READY });
      expect(order.canTransitionTo(OrderStatus.DELIVERED)).toBe(true);
    });

    it('can transition to REPORTED', () => {
      const order = createOrder({ status: OrderStatus.READY });
      expect(order.canBeReported()).toBe(true);
    });

    it('cannot be cancelled', () => {
      const order = createOrder({ status: OrderStatus.READY });
      expect(order.canBeCancelled()).toBe(false);
    });
  });

  describe('Valid State Transitions from DELIVERED', () => {
    it('can transition to REPORTED', () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });
      expect(order.canBeReported()).toBe(true);
    });

    it('cannot be cancelled', () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });
      expect(order.canBeCancelled()).toBe(false);
    });
  });

  describe('Terminal States', () => {
    it('REJECTED is a terminal state', () => {
      const order = createOrder({ status: OrderStatus.REJECTED });
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('CANCELLED is a terminal state', () => {
      const order = createOrder({ status: OrderStatus.CANCELLED });
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('REPORTED is a terminal state', () => {
      const order = createOrder({ status: OrderStatus.REPORTED });
      expect(order.getValidNextStates()).toHaveLength(0);
    });
  });

  describe('Accept Order', () => {
    it('should accept a pending order', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      const accepted = order.accept();

      expect(accepted.status).toBe(OrderStatus.ACCEPTED);
    });

    it('should throw error when accepting non-pending order', () => {
      const order = createOrder({ status: OrderStatus.CONFIRMED });

      expect(() => order.accept()).toThrow();
    });
  });

  describe('Reject Order', () => {
    it('should reject a pending order with reason', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      const rejected = order.reject('Out of ingredients');

      expect(rejected.status).toBe(OrderStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Out of ingredients');
    });

    it('should throw error when rejecting without reason', () => {
      const order = createOrder({ status: OrderStatus.PENDING });

      expect(() => order.reject('')).toThrow('Rejection reason is required');
    });

    it('should throw error when rejecting non-pending order', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });

      expect(() => order.reject('Some reason')).toThrow();
    });
  });

  describe('Cancel Order', () => {
    it('should cancel a pending order', () => {
      const order = createOrder({ status: OrderStatus.PENDING });
      const cancelled = order.cancel('Customer request');

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect(cancelled.cancellationReason).toBe('Customer request');
    });

    it('should cancel an accepted order', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      const cancelled = order.cancel();

      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it('should throw error when cancelling delivered order', () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });

      expect(() => order.cancel()).toThrow();
    });
  });

  describe('Report Order', () => {
    it('should report an accepted order with reason', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      const reported = order.report('Customer complaint');

      expect(reported.status).toBe(OrderStatus.REPORTED);
      expect(reported.reportReason).toBe('Customer complaint');
    });

    it('should report a delivered order', () => {
      const order = createOrder({ status: OrderStatus.DELIVERED });
      const reported = order.report('Quality issue reported');

      expect(reported.status).toBe(OrderStatus.REPORTED);
    });

    it('should throw error when reporting without reason', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });

      expect(() => order.report('')).toThrow('Report reason is required');
    });

    it('should throw error when reporting pending order', () => {
      const order = createOrder({ status: OrderStatus.PENDING });

      expect(() => order.report('Some reason')).toThrow();
    });
  });

  describe('Confirm Order', () => {
    it('should confirm an accepted order', () => {
      const order = createOrder({ status: OrderStatus.ACCEPTED });
      const confirmed = order.confirm();

      expect(confirmed.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should throw error when confirming pending order', () => {
      const order = createOrder({ status: OrderStatus.PENDING });

      expect(() => order.confirm()).toThrow();
    });
  });

  describe('Prepare Order', () => {
    it('should start preparing a confirmed order', () => {
      const order = createOrder({ status: OrderStatus.CONFIRMED });
      const preparing = order.startPreparing();

      expect(preparing.status).toBe(OrderStatus.PREPARING);
    });
  });

  describe('Ready Order', () => {
    it('should mark a preparing order as ready', () => {
      const order = createOrder({ status: OrderStatus.PREPARING });
      const ready = order.markReady();

      expect(ready.status).toBe(OrderStatus.READY);
    });
  });

  describe('Deliver Order', () => {
    it('should mark a ready order as delivered', () => {
      const order = createOrder({ status: OrderStatus.READY });
      const delivered = order.markDelivered();

      expect(delivered.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('Full Order Lifecycle', () => {
    it('should complete full happy path', () => {
      let order = createOrder({ status: OrderStatus.PENDING });

      // Accept
      order = order.accept();
      expect(order.status).toBe(OrderStatus.ACCEPTED);

      // Confirm
      order = order.confirm();
      expect(order.status).toBe(OrderStatus.CONFIRMED);

      // Start preparing
      order = order.startPreparing();
      expect(order.status).toBe(OrderStatus.PREPARING);

      // Mark ready
      order = order.markReady();
      expect(order.status).toBe(OrderStatus.READY);

      // Deliver
      order = order.markDelivered();
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it('should handle rejection path', () => {
      let order = createOrder({ status: OrderStatus.PENDING });

      // Reject
      order = order.reject('Restaurant is closed');
      expect(order.status).toBe(OrderStatus.REJECTED);
      expect(order.rejectionReason).toBe('Restaurant is closed');

      // Should be terminal
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('should handle cancellation during preparation', () => {
      let order = createOrder({ status: OrderStatus.PENDING });

      // Accept
      order = order.accept();

      // Confirm
      order = order.confirm();

      // Start preparing
      order = order.startPreparing();

      // Cancel (still possible during preparation)
      order = order.cancel('Customer cancelled');
      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellationReason).toBe('Customer cancelled');
    });
  });
});
