// Domain Entity - Analytics Event

export enum AnalyticsEventType {
  DISH_VIEWED = 'DISH_VIEWED',
  MENU_VIEWED = 'MENU_VIEWED',
  ORDER_CREATED = 'ORDER_CREATED',
  RESTAURANT_VIEWED = 'RESTAURANT_VIEWED',
}

export interface AnalyticsEventProps {
  id: string;
  eventType: AnalyticsEventType;
  restaurantId: string;
  menuItemId?: string | null;
  userId?: string | null;
  metadata?: Record<string, unknown> | null;
  idempotencyKey: string;
  createdAt: Date;
}

export class AnalyticsEvent {
  private readonly props: AnalyticsEventProps;

  constructor(props: AnalyticsEventProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get eventType(): AnalyticsEventType {
    return this.props.eventType;
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }

  get menuItemId(): string | null | undefined {
    return this.props.menuItemId;
  }

  get userId(): string | null | undefined {
    return this.props.userId;
  }

  get metadata(): Record<string, unknown> | null | undefined {
    return this.props.metadata;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  toJSON(): AnalyticsEventProps {
    return { ...this.props };
  }
}
