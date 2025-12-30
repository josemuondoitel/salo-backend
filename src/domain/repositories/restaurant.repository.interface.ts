// Domain Repository Interface - Restaurant
import { Restaurant, RestaurantStatus } from '../entities/restaurant.entity';

export interface CreateRestaurantData {
  name: string;
  description?: string | null;
  address: string;
  phone: string;
  ownerId: string;
}

export interface IRestaurantRepository {
  findById(id: string, includeDeleted?: boolean): Promise<Restaurant | null>;
  findByOwnerId(
    ownerId: string,
    includeDeleted?: boolean,
  ): Promise<Restaurant | null>;

  /**
   * Find all ACTIVE restaurants with valid subscriptions
   * This enforces visibility rules at the repository level
   * Excludes soft deleted restaurants
   */
  findAllVisible(): Promise<Restaurant[]>;

  /**
   * Find restaurants by status (excludes soft deleted by default)
   */
  findByStatus(
    status: RestaurantStatus,
    includeDeleted?: boolean,
  ): Promise<Restaurant[]>;

  create(data: CreateRestaurantData): Promise<Restaurant>;
  updateStatus(id: string, status: RestaurantStatus): Promise<Restaurant>;
  update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      address: string;
      phone: string;
    }>,
  ): Promise<Restaurant>;

  /**
   * Soft delete a restaurant (sets deletedAt)
   */
  softDelete(id: string): Promise<Restaurant>;

  /**
   * Restore a soft deleted restaurant
   */
  restore(id: string): Promise<Restaurant>;

  /**
   * @deprecated Use softDelete instead. Physical delete is not recommended.
   */
  delete(id: string): Promise<void>;
}

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');
