// E2E Tests - Restaurant Order Actions
// Tests verify order state transitions and restaurant actions

import { Order, OrderStatus } from '../src/domain/entities/order.entity';

describe('Restaurant Order Actions (Integration)', () => {
  const createOrder = (status: OrderStatus = OrderStatus.PENDING) =>
    new Order({
      id: 'order-1',
      status,
      totalAmount: 100.0,
      notes: 'No onions please',
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
    });

  describe('Accept Order', () => {
    it('should accept a pending order', () => {
      const order = createOrder(OrderStatus.PENDING);
      expect(order.canBeAccepted()).toBe(true);

      const accepted = order.accept();
      expect(accepted.status).toBe(OrderStatus.ACCEPTED);
      expect(accepted.isAccepted()).toBe(true);
    });

    it('should NOT accept an already accepted order', () => {
      const order = createOrder(OrderStatus.ACCEPTED);
      expect(order.canBeAccepted()).toBe(false);

      expect(() => order.accept()).toThrow();
    });

    it('should NOT accept a rejected order', () => {
      const order = createOrder(OrderStatus.REJECTED);
      expect(order.canBeAccepted()).toBe(false);
    });

    it('should NOT accept a cancelled order', () => {
      const order = createOrder(OrderStatus.CANCELLED);
      expect(order.canBeAccepted()).toBe(false);
    });
  });

  describe('Reject Order', () => {
    it('should reject a pending order with reason', () => {
      const order = createOrder(OrderStatus.PENDING);
      expect(order.canBeRejected()).toBe(true);

      const rejected = order.reject('Out of ingredients');
      expect(rejected.status).toBe(OrderStatus.REJECTED);
      expect(rejected.rejectionReason).toBe('Out of ingredients');
    });

    it('should require reason for rejection', () => {
      const order = createOrder(OrderStatus.PENDING);

      expect(() => order.reject('')).toThrow('Rejection reason is required');
      expect(() => order.reject('   ')).toThrow('Rejection reason is required');
    });

    it('should NOT reject an accepted order', () => {
      const order = createOrder(OrderStatus.ACCEPTED);
      expect(order.canBeRejected()).toBe(false);

      expect(() => order.reject('Some reason')).toThrow();
    });

    it('should NOT reject an already rejected order', () => {
      const order = createOrder(OrderStatus.REJECTED);
      expect(order.canBeRejected()).toBe(false);
    });
  });

  describe('Cancel Order', () => {
    it('should cancel a pending order', () => {
      const order = createOrder(OrderStatus.PENDING);
      expect(order.canBeCancelled()).toBe(true);

      const cancelled = order.cancel('Customer requested');
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect(cancelled.cancellationReason).toBe('Customer requested');
    });

    it('should cancel an accepted order', () => {
      const order = createOrder(OrderStatus.ACCEPTED);
      expect(order.canBeCancelled()).toBe(true);

      const cancelled = order.cancel();
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it('should cancel a confirmed order', () => {
      const order = createOrder(OrderStatus.CONFIRMED);
      expect(order.canBeCancelled()).toBe(true);

      const cancelled = order.cancel('Kitchen overloaded');
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
      expect(cancelled.cancellationReason).toBe('Kitchen overloaded');
    });

    it('should cancel a preparing order', () => {
      const order = createOrder(OrderStatus.PREPARING);
      expect(order.canBeCancelled()).toBe(true);

      const cancelled = order.cancel();
      expect(cancelled.status).toBe(OrderStatus.CANCELLED);
    });

    it('should NOT cancel a ready order', () => {
      const order = createOrder(OrderStatus.READY);
      expect(order.canBeCancelled()).toBe(false);

      expect(() => order.cancel()).toThrow();
    });

    it('should NOT cancel a delivered order', () => {
      const order = createOrder(OrderStatus.DELIVERED);
      expect(order.canBeCancelled()).toBe(false);
    });

    it('should NOT cancel an already cancelled order', () => {
      const order = createOrder(OrderStatus.CANCELLED);
      expect(order.canBeCancelled()).toBe(false);
    });
  });

  describe('Report Order', () => {
    it('should report an accepted order', () => {
      const order = createOrder(OrderStatus.ACCEPTED);
      expect(order.canBeReported()).toBe(true);

      const reported = order.report('Customer no-show');
      expect(reported.status).toBe(OrderStatus.REPORTED);
      expect(reported.reportReason).toBe('Customer no-show');
    });

    it('should report a confirmed order', () => {
      const order = createOrder(OrderStatus.CONFIRMED);
      expect(order.canBeReported()).toBe(true);

      const reported = order.report('Suspicious activity');
      expect(reported.status).toBe(OrderStatus.REPORTED);
    });

    it('should report a preparing order', () => {
      const order = createOrder(OrderStatus.PREPARING);
      expect(order.canBeReported()).toBe(true);
    });

    it('should report a ready order', () => {
      const order = createOrder(OrderStatus.READY);
      expect(order.canBeReported()).toBe(true);
    });

    it('should report a delivered order', () => {
      const order = createOrder(OrderStatus.DELIVERED);
      expect(order.canBeReported()).toBe(true);

      const reported = order.report('Quality issue reported');
      expect(reported.status).toBe(OrderStatus.REPORTED);
      expect(reported.reportReason).toBe('Quality issue reported');
    });

    it('should require reason for report', () => {
      const order = createOrder(OrderStatus.ACCEPTED);

      expect(() => order.report('')).toThrow('Report reason is required');
    });

    it('should NOT report a pending order', () => {
      const order = createOrder(OrderStatus.PENDING);
      expect(order.canBeReported()).toBe(false);

      expect(() => order.report('Some reason')).toThrow();
    });

    it('should NOT report an already reported order', () => {
      const order = createOrder(OrderStatus.REPORTED);
      expect(order.canBeReported()).toBe(false);
    });
  });

  describe('Order Confirmation Flow', () => {
    it('should confirm an accepted order', () => {
      const order = createOrder(OrderStatus.ACCEPTED);

      const confirmed = order.confirm();
      expect(confirmed.status).toBe(OrderStatus.CONFIRMED);
    });

    it('should NOT confirm a pending order', () => {
      const order = createOrder(OrderStatus.PENDING);

      expect(() => order.confirm()).toThrow();
    });
  });

  describe('Preparation Flow', () => {
    it('should start preparing a confirmed order', () => {
      const order = createOrder(OrderStatus.CONFIRMED);

      const preparing = order.startPreparing();
      expect(preparing.status).toBe(OrderStatus.PREPARING);
    });

    it('should mark a preparing order as ready', () => {
      const order = createOrder(OrderStatus.PREPARING);

      const ready = order.markReady();
      expect(ready.status).toBe(OrderStatus.READY);
    });

    it('should deliver a ready order', () => {
      const order = createOrder(OrderStatus.READY);

      const delivered = order.markDelivered();
      expect(delivered.status).toBe(OrderStatus.DELIVERED);
    });
  });

  describe('Complete Order Lifecycle', () => {
    it('should complete happy path: PENDING -> ACCEPTED -> CONFIRMED -> PREPARING -> READY -> DELIVERED', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.accept();
      expect(order.status).toBe(OrderStatus.ACCEPTED);

      order = order.confirm();
      expect(order.status).toBe(OrderStatus.CONFIRMED);

      order = order.startPreparing();
      expect(order.status).toBe(OrderStatus.PREPARING);

      order = order.markReady();
      expect(order.status).toBe(OrderStatus.READY);

      order = order.markDelivered();
      expect(order.status).toBe(OrderStatus.DELIVERED);
    });

    it('should handle rejection path', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.reject('Restaurant closed for the day');
      expect(order.status).toBe(OrderStatus.REJECTED);
      expect(order.rejectionReason).toBe('Restaurant closed for the day');

      // Verify terminal state
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('should handle early cancellation', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.accept();
      order = order.confirm();
      order = order.cancel('Customer changed mind');

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.cancellationReason).toBe('Customer changed mind');
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('should handle late cancellation during preparation', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.accept();
      order = order.confirm();
      order = order.startPreparing();
      order = order.cancel('Kitchen issue');

      expect(order.status).toBe(OrderStatus.CANCELLED);
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('should handle post-delivery report', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.accept();
      order = order.confirm();
      order = order.startPreparing();
      order = order.markReady();
      order = order.markDelivered();

      // Post-delivery report
      order = order.report('Customer complained about quality');
      expect(order.status).toBe(OrderStatus.REPORTED);
      expect(order.reportReason).toBe('Customer complained about quality');
    });
  });

  describe('Invalid Transitions', () => {
    it('should not allow direct PENDING -> CONFIRMED', () => {
      const order = createOrder(OrderStatus.PENDING);

      expect(order.canTransitionTo(OrderStatus.CONFIRMED)).toBe(false);
      expect(() => order.confirm()).toThrow();
    });

    it('should not allow direct PENDING -> PREPARING', () => {
      const order = createOrder(OrderStatus.PENDING);

      expect(order.canTransitionTo(OrderStatus.PREPARING)).toBe(false);
      expect(() => order.startPreparing()).toThrow();
    });

    it('should not allow direct PENDING -> READY', () => {
      const order = createOrder(OrderStatus.PENDING);

      expect(order.canTransitionTo(OrderStatus.READY)).toBe(false);
      expect(() => order.markReady()).toThrow();
    });

    it('should not allow direct PENDING -> DELIVERED', () => {
      const order = createOrder(OrderStatus.PENDING);

      expect(order.canTransitionTo(OrderStatus.DELIVERED)).toBe(false);
      expect(() => order.markDelivered()).toThrow();
    });

    it('should not allow ACCEPTED -> PREPARING (must go through CONFIRMED)', () => {
      const order = createOrder(OrderStatus.ACCEPTED);

      expect(order.canTransitionTo(OrderStatus.PREPARING)).toBe(false);
      expect(() => order.startPreparing()).toThrow();
    });

    it('should not allow backwards transitions', () => {
      const order = createOrder(OrderStatus.CONFIRMED);

      expect(order.canTransitionTo(OrderStatus.PENDING)).toBe(false);
      expect(order.canTransitionTo(OrderStatus.ACCEPTED)).toBe(false);
    });
  });

  describe('Terminal States', () => {
    it('REJECTED is terminal', () => {
      const order = createOrder(OrderStatus.REJECTED);
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('CANCELLED is terminal', () => {
      const order = createOrder(OrderStatus.CANCELLED);
      expect(order.getValidNextStates()).toHaveLength(0);
    });

    it('REPORTED is terminal', () => {
      const order = createOrder(OrderStatus.REPORTED);
      expect(order.getValidNextStates()).toHaveLength(0);
    });
  });

  describe('Idempotency Considerations', () => {
    it('should preserve notes (observation) as immutable', () => {
      const order = createOrder(OrderStatus.PENDING);
      expect(order.notes).toBe('No onions please');

      const accepted = order.accept();
      expect(accepted.notes).toBe('No onions please');

      const confirmed = accepted.confirm();
      expect(confirmed.notes).toBe('No onions please');
    });

    it('should preserve customer and restaurant IDs through transitions', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.accept();
      order = order.confirm();

      expect(order.customerId).toBe('customer-1');
      expect(order.restaurantId).toBe('restaurant-1');
    });

    it('should preserve total amount through transitions', () => {
      let order = createOrder(OrderStatus.PENDING);

      order = order.accept();
      order = order.confirm();
      order = order.startPreparing();

      expect(order.totalAmount).toBe(100.0);
    });
  });
});
