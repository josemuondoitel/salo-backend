// Domain Entity - Subscription

export enum SubscriptionStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface SubscriptionProps {
  id: string;
  status: SubscriptionStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  monthlyAmount: number;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Subscription {
  private readonly props: SubscriptionProps;

  constructor(props: SubscriptionProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get status(): SubscriptionStatus {
    return this.props.status;
  }

  get startDate(): Date | null | undefined {
    return this.props.startDate;
  }

  get endDate(): Date | null | undefined {
    return this.props.endDate;
  }

  get monthlyAmount(): number {
    return this.props.monthlyAmount;
  }

  get restaurantId(): string {
    return this.props.restaurantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * Check if subscription is currently valid
   * DETERMINISTIC: Based solely on status and end date
   */
  isValid(): boolean {
    if (this.props.status !== SubscriptionStatus.ACTIVE) {
      return false;
    }

    if (!this.props.endDate) {
      return false;
    }

    const now = new Date();
    return this.props.endDate > now;
  }

  /**
   * Check if subscription has expired
   * DETERMINISTIC: Based on end date comparison with current time
   */
  isExpired(): boolean {
    if (!this.props.endDate) {
      return this.props.status === SubscriptionStatus.EXPIRED;
    }

    const now = new Date();
    return this.props.endDate <= now;
  }

  isActive(): boolean {
    return this.props.status === SubscriptionStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.props.status === SubscriptionStatus.PENDING;
  }

  /**
   * Calculate days remaining in subscription
   */
  daysRemaining(): number {
    if (!this.props.endDate) {
      return 0;
    }

    const now = new Date();
    const diff = this.props.endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  /**
   * Activate subscription with start and end dates
   * Returns new Subscription instance (immutability)
   */
  activate(startDate: Date, endDate: Date): Subscription {
    return new Subscription({
      ...this.props,
      status: SubscriptionStatus.ACTIVE,
      startDate,
      endDate,
      updatedAt: new Date(),
    });
  }

  /**
   * Mark subscription as expired
   * Returns new Subscription instance (immutability)
   */
  expire(): Subscription {
    return new Subscription({
      ...this.props,
      status: SubscriptionStatus.EXPIRED,
      updatedAt: new Date(),
    });
  }

  /**
   * Cancel subscription
   * Returns new Subscription instance (immutability)
   */
  cancel(): Subscription {
    return new Subscription({
      ...this.props,
      status: SubscriptionStatus.CANCELLED,
      updatedAt: new Date(),
    });
  }

  toJSON(): SubscriptionProps {
    return { ...this.props };
  }
}
