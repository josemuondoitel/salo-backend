// Domain Repository Interface - Product
import { Product, ProductStatus } from '../entities/product.entity';

export interface CreateProductData {
  name: string;
  description?: string | null;
  price: number;
  quantity: number;
  status?: ProductStatus;
  imageId?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
  restaurantId: string;
}

export interface UpdateProductData {
  name?: string;
  description?: string | null;
  price?: number;
  quantity?: number;
  status?: ProductStatus;
  imageId?: string | null;
  imageUrl?: string | null;
  isFeatured?: boolean;
  sortOrder?: number;
  metadata?: Record<string, unknown> | null;
}

export interface IProductRepository {
  /**
   * Find product by ID (excludes soft deleted by default)
   */
  findById(id: string, includeDeleted?: boolean): Promise<Product | null>;

  /**
   * Find products by restaurant ID (excludes soft deleted by default)
   */
  findByRestaurantId(
    restaurantId: string,
    includeDeleted?: boolean,
  ): Promise<Product[]>;

  /**
   * Find visible products for a restaurant (ACTIVE status only, excludes soft deleted)
   */
  findVisibleByRestaurantId(restaurantId: string): Promise<Product[]>;

  /**
   * Find featured products for a restaurant
   */
  findFeaturedByRestaurantId(restaurantId: string): Promise<Product[]>;

  /**
   * Create a new product
   */
  create(data: CreateProductData): Promise<Product>;

  /**
   * Update a product
   */
  update(id: string, data: UpdateProductData): Promise<Product>;

  /**
   * Soft delete a product
   */
  softDelete(id: string): Promise<Product>;

  /**
   * Restore a soft deleted product
   */
  restore(id: string): Promise<Product>;

  /**
   * Update product status
   */
  updateStatus(id: string, status: ProductStatus): Promise<Product>;
}

export const PRODUCT_REPOSITORY = Symbol('PRODUCT_REPOSITORY');
