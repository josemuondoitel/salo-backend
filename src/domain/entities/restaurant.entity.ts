// Domain Entity - Restaurant

export enum RestaurantStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  INACTIVE = 'INACTIVE',
}

export interface RestaurantProps {
  id: string;
  name: string;
  description?: string | null;
  address: string;
  phone: string;
  status: RestaurantStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Restaurant {
  private readonly props: RestaurantProps;

  constructor(props: RestaurantProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get name(): string {
    return this.props.name;
  }

  get description(): string | null | undefined {
    return this.props.description;
  }

  get address(): string {
    return this.props.address;
  }

  get phone(): string {
    return this.props.phone;
  }

  get status(): RestaurantStatus {
    return this.props.status;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  /**
   * VISIBILITY RULE: Restaurant is visible ONLY if status is ACTIVE
   * This is a computed property, not stored in database
   */
  get isVisible(): boolean {
    return this.props.status === RestaurantStatus.ACTIVE;
  }

  /**
   * VISIBILITY SCORE: ZERO if not active
   * This enforces the ZERO TOLERANCE visibility rule
   */
  get visibility(): number {
    return this.isVisible ? 100 : 0;
  }

  isActive(): boolean {
    return this.props.status === RestaurantStatus.ACTIVE;
  }

  isPending(): boolean {
    return this.props.status === RestaurantStatus.PENDING;
  }

  isSuspended(): boolean {
    return this.props.status === RestaurantStatus.SUSPENDED;
  }

  canReceiveOrders(): boolean {
    return this.isActive();
  }

  /**
   * Suspend restaurant - used when subscription expires
   * Returns new Restaurant instance (immutability)
   */
  suspend(): Restaurant {
    return new Restaurant({
      ...this.props,
      status: RestaurantStatus.SUSPENDED,
      updatedAt: new Date(),
    });
  }

  /**
   * Activate restaurant - used when subscription is validated
   * Returns new Restaurant instance (immutability)
   */
  activate(): Restaurant {
    return new Restaurant({
      ...this.props,
      status: RestaurantStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  toJSON(): RestaurantProps {
    return { ...this.props };
  }
}
