// Domain Entity - Order

export enum OrderStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REPORTED = 'REPORTED',
}

export interface OrderItemProps {
  id: string;
  quantity: number;
  unitPrice: number;
  menuItemId: string;
}

export interface OrderProps {
  id: string;
  status: OrderStatus;
  totalAmount: number;
  notes?: string | null;
  idempotencyKey: string;
  customerId: string;
  restaurantId: string;
  items: OrderItemProps[];
  rejectionReason?: string | null;
  reportReason?: string | null;
  cancellationReason?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Valid state transitions for the order state machine
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.ACCEPTED,
    OrderStatus.REJECTED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.ACCEPTED]: [
    OrderStatus.CONFIRMED,
    OrderStatus.CANCELLED,
    OrderStatus.REPORTED,
  ],
  [OrderStatus.REJECTED]: [], // Terminal state
  [OrderStatus.CONFIRMED]: [
    OrderStatus.PREPARING,
    OrderStatus.CANCELLED,
    OrderStatus.REPORTED,
  ],
  [OrderStatus.PREPARING]: [
    OrderStatus.READY,
    OrderStatus.CANCELLED,
    OrderStatus.REPORTED,
  ],
  [OrderStatus.READY]: [OrderStatus.DELIVERED, OrderStatus.REPORTED],
  [OrderStatus.DELIVERED]: [OrderStatus.REPORTED], // Can still be reported after delivery
  [OrderStatus.CANCELLED]: [], // Terminal state
  [OrderStatus.REPORTED]: [], // Terminal state
};

export class Order {
  private readonly props: OrderProps;

  constructor(props: OrderProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get notes(): string | null | undefined {
    return this.props.notes;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }

  get items(): OrderItemProps[] {
    return [...this.props.items];
  }

  get rejectionReason(): string | null | undefined {
    return this.props.rejectionReason;
  }

  get reportReason(): string | null | undefined {
    return this.props.reportReason;
  }

  get cancellationReason(): string | null | undefined {
    return this.props.cancellationReason;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }

  isAccepted(): boolean {
    return this.props.status === OrderStatus.ACCEPTED;
  }

  isRejected(): boolean {
    return this.props.status === OrderStatus.REJECTED;
  }

  isConfirmed(): boolean {
    return this.props.status === OrderStatus.CONFIRMED;
  }

  isCancelled(): boolean {
    return this.props.status === OrderStatus.CANCELLED;
  }

  isDelivered(): boolean {
    return this.props.status === OrderStatus.DELIVERED;
  }

  isReported(): boolean {
    return this.props.status === OrderStatus.REPORTED;
  }

  /**
   * Check if a transition to the given status is valid
   */
  canTransitionTo(newStatus: OrderStatus): boolean {
    const validNextStates = VALID_TRANSITIONS[this.props.status] || [];
    return validNextStates.includes(newStatus);
  }

  /**
   * Get all valid next states for the current status
   */
  getValidNextStates(): OrderStatus[] {
    return [...(VALID_TRANSITIONS[this.props.status] || [])];
  }

  canBeCancelled(): boolean {
    return this.canTransitionTo(OrderStatus.CANCELLED);
  }

  canBeAccepted(): boolean {
    return this.canTransitionTo(OrderStatus.ACCEPTED);
  }

  canBeRejected(): boolean {
    return this.canTransitionTo(OrderStatus.REJECTED);
  }

  canBeReported(): boolean {
    return this.canTransitionTo(OrderStatus.REPORTED);
  }

  /**
   * Accept order (Restaurant action)
   */
  accept(): Order {
    if (!this.canBeAccepted()) {
      throw new Error(
        `Cannot accept order in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    return new Order({
      ...this.props,
      status: OrderStatus.ACCEPTED,
      updatedAt: new Date(),
    });
  }

  /**
   * Reject order with reason (Restaurant action)
   */
  reject(reason: string): Order {
    if (!this.canBeRejected()) {
      throw new Error(
        `Cannot reject order in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    if (!reason || reason.trim() === '') {
      throw new Error('Rejection reason is required');
    }
    return new Order({
      ...this.props,
      status: OrderStatus.REJECTED,
      rejectionReason: reason,
      updatedAt: new Date(),
    });
  }

  confirm(): Order {
    if (!this.canTransitionTo(OrderStatus.CONFIRMED)) {
      throw new Error(
        `Cannot confirm order in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    return new Order({
      ...this.props,
      status: OrderStatus.CONFIRMED,
      updatedAt: new Date(),
    });
  }

  startPreparing(): Order {
    if (!this.canTransitionTo(OrderStatus.PREPARING)) {
      throw new Error(
        `Cannot start preparing order in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    return new Order({
      ...this.props,
      status: OrderStatus.PREPARING,
      updatedAt: new Date(),
    });
  }

  markReady(): Order {
    if (!this.canTransitionTo(OrderStatus.READY)) {
      throw new Error(
        `Cannot mark order as ready in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    return new Order({
      ...this.props,
      status: OrderStatus.READY,
      updatedAt: new Date(),
    });
  }

  markDelivered(): Order {
    if (!this.canTransitionTo(OrderStatus.DELIVERED)) {
      throw new Error(
        `Cannot mark order as delivered in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    return new Order({
      ...this.props,
      status: OrderStatus.DELIVERED,
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel order with optional reason (Restaurant action)
   */
  cancel(reason?: string): Order {
    if (!this.canBeCancelled()) {
      throw new Error(
        `Cannot cancel order in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    return new Order({
      ...this.props,
      status: OrderStatus.CANCELLED,
      cancellationReason: reason || null,
      updatedAt: new Date(),
    });
  }

  /**
   * Report order with reason (Restaurant action)
   */
  report(reason: string): Order {
    if (!this.canBeReported()) {
      throw new Error(
        `Cannot report order in status ${this.props.status}. Valid transitions: ${this.getValidNextStates().join(', ') || 'none'}`,
      );
    }
    if (!reason || reason.trim() === '') {
      throw new Error('Report reason is required');
    }
    return new Order({
      ...this.props,
      status: OrderStatus.REPORTED,
      reportReason: reason,
      updatedAt: new Date(),
    });
  }

  toJSON(): OrderProps {
    return { ...this.props };
  }
}
