// Domain Entity - Order

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PREPARING = 'PREPARING',
  READY = 'READY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
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
  createdAt: Date;
  updatedAt: Date;
}

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

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
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

  canBeCancelled(): boolean {
    return [OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(
      this.props.status,
    );
  }

  confirm(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.CONFIRMED,
      updatedAt: new Date(),
    });
  }

  startPreparing(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.PREPARING,
      updatedAt: new Date(),
    });
  }

  markReady(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.READY,
      updatedAt: new Date(),
    });
  }

  markDelivered(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.DELIVERED,
      updatedAt: new Date(),
    });
  }

  cancel(): Order {
    return new Order({
      ...this.props,
      status: OrderStatus.CANCELLED,
      updatedAt: new Date(),
    });
  }

  toJSON(): OrderProps {
    return { ...this.props };
  }
}
