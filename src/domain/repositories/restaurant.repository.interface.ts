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
  findById(id: string): Promise<Restaurant | null>;
  findByOwnerId(ownerId: string): Promise<Restaurant | null>;

  /**
   * Find all ACTIVE restaurants with valid subscriptions
   * This enforces visibility rules at the repository level
   */
  findAllVisible(): Promise<Restaurant[]>;

  /**
   * Find restaurants by status
   */
  findByStatus(status: RestaurantStatus): Promise<Restaurant[]>;

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
  delete(id: string): Promise<void>;
}

export const RESTAURANT_REPOSITORY = Symbol('RESTAURANT_REPOSITORY');
