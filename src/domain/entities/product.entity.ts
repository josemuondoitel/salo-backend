// Domain Entity - Product

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

export interface ProductProps {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  status: ProductStatus;
  imageId?: string | null;
  imageUrl?: string | null;
  isFeatured: boolean;
  sortOrder: number;
  metadata?: Record<string, unknown> | null;
  deletedAt?: Date | null;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export class Product {
  private readonly props: ProductProps;

  constructor(props: ProductProps) {
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

  get price(): number {
    return this.props.price;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  get status(): ProductStatus {
    return this.props.status;
  }

  get imageId(): string | null | undefined {
    return this.props.imageId;
  }

  get imageUrl(): string | null | undefined {
    return this.props.imageUrl;
  }

  get isFeatured(): boolean {
    return this.props.isFeatured;
  }

  get sortOrder(): number {
    return this.props.sortOrder;
  }

  get metadata(): Record<string, unknown> | null | undefined {
    return this.props.metadata;
  }

  get deletedAt(): Date | null | undefined {
    return this.props.deletedAt;
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
   * Check if product is soft deleted
   */
  isDeleted(): boolean {
    return this.props.deletedAt !== null && this.props.deletedAt !== undefined;
  }

  /**
   * Check if product is active and available
   */
  isActive(): boolean {
    return this.props.status === ProductStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * Check if product is out of stock
   */
  isOutOfStock(): boolean {
    return this.props.status === ProductStatus.OUT_OF_STOCK;
  }

  /**
   * Check if product is inactive
   */
  isInactive(): boolean {
    return this.props.status === ProductStatus.INACTIVE;
  }

  /**
   * VISIBILITY RULE: Product is visible ONLY if status is ACTIVE and not deleted
   * The restaurant's visibility check must be done at the use case level
   */
  get isVisible(): boolean {
    return this.props.status === ProductStatus.ACTIVE && !this.isDeleted();
  }

  /**
   * Check if product can be ordered
   */
  canBeOrdered(): boolean {
    return this.isActive() && this.props.quantity > 0;
  }

  /**
   * Activate product
   */
  activate(): Product {
    return new Product({
      ...this.props,
      status: ProductStatus.ACTIVE,
      updatedAt: new Date(),
    });
  }

  /**
   * Deactivate product
   */
  deactivate(): Product {
    return new Product({
      ...this.props,
      status: ProductStatus.INACTIVE,
      updatedAt: new Date(),
    });
  }

  /**
   * Mark product as out of stock
   */
  markOutOfStock(): Product {
    return new Product({
      ...this.props,
      status: ProductStatus.OUT_OF_STOCK,
      updatedAt: new Date(),
    });
  }

  /**
   * Update quantity (logical availability)
   * If quantity is 0 and product is not INACTIVE, sets status to OUT_OF_STOCK
   */
  updateQuantity(quantity: number): Product {
    if (quantity < 0) {
      throw new Error('Quantity cannot be negative');
    }
    // Auto-set to OUT_OF_STOCK when quantity is 0, unless already INACTIVE
    const status =
      quantity === 0 && this.props.status !== ProductStatus.INACTIVE
        ? ProductStatus.OUT_OF_STOCK
        : this.props.status;
    return new Product({
      ...this.props,
      quantity,
      status,
      updatedAt: new Date(),
    });
  }

  /**
   * Update image
   */
  updateImage(imageId: string | null, imageUrl: string | null): Product {
    return new Product({
      ...this.props,
      imageId,
      imageUrl,
      updatedAt: new Date(),
    });
  }

  /**
   * Set featured status
   */
  setFeatured(isFeatured: boolean): Product {
    return new Product({
      ...this.props,
      isFeatured,
      updatedAt: new Date(),
    });
  }

  /**
   * Soft delete product
   */
  softDelete(): Product {
    return new Product({
      ...this.props,
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Restore soft deleted product
   */
  restore(): Product {
    return new Product({
      ...this.props,
      deletedAt: null,
      updatedAt: new Date(),
    });
  }

  toJSON(): ProductProps {
    return { ...this.props };
  }
}
