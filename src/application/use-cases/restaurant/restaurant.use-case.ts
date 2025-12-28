// Restaurant Use Cases
import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IRestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository.interface';
import {
  ISubscriptionRepository,
  SUBSCRIPTION_REPOSITORY,
} from '../../../domain/repositories/subscription.repository.interface';
import {
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
  AuditAction,
} from '../../../domain/repositories/audit-log.repository.interface';
import { CreateRestaurantDto, UpdateRestaurantDto, RestaurantResponseDto } from '../../dtos/restaurant.dto';
import { Restaurant } from '../../../domain/entities/restaurant.entity';

@Injectable()
export class RestaurantUseCase {
  constructor(
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository
  ) {}

  /**
   * Create a new restaurant
   * Requires RESTAURANT_OWNER role
   */
  async create(
    dto: CreateRestaurantDto,
    ownerId: string,
    correlationId?: string
  ): Promise<RestaurantResponseDto> {
    // Check if owner already has a restaurant
    const existingRestaurant = await this.restaurantRepository.findByOwnerId(ownerId);
    if (existingRestaurant) {
      throw new ForbiddenException('User already owns a restaurant');
    }

    const restaurant = await this.restaurantRepository.create({
      name: dto.name,
      description: dto.description,
      address: dto.address,
      phone: dto.phone,
      ownerId,
    });

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.RESTAURANT_CREATED,
      entityType: 'Restaurant',
      entityId: restaurant.id,
      newState: restaurant.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
    });

    return this.toResponseDto(restaurant);
  }

  /**
   * Get restaurant by ID
   * Only visible restaurants can be retrieved by non-owners
   */
  async findById(id: string, requesterId?: string): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    // If requester is not the owner and restaurant is not visible, deny access
    if (requesterId !== restaurant.ownerId && !restaurant.isVisible) {
      throw new NotFoundException('Restaurant not found');
    }

    return this.toResponseDto(restaurant);
  }

  /**
   * Get restaurant by owner ID
   */
  async findByOwnerId(ownerId: string): Promise<RestaurantResponseDto | null> {
    const restaurant = await this.restaurantRepository.findByOwnerId(ownerId);
    return restaurant ? this.toResponseDto(restaurant) : null;
  }

  /**
   * Get all visible restaurants
   * VISIBILITY ENFORCEMENT: Only returns ACTIVE restaurants with valid subscriptions
   */
  async findAllVisible(): Promise<RestaurantResponseDto[]> {
    const restaurants = await this.restaurantRepository.findAllVisible();
    return restaurants.map((r) => this.toResponseDto(r));
  }

  /**
   * Update restaurant
   * Only owner can update
   */
  async update(
    id: string,
    dto: UpdateRestaurantDto,
    ownerId: string
  ): Promise<RestaurantResponseDto> {
    const restaurant = await this.restaurantRepository.findById(id);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to update this restaurant');
    }

    const updated = await this.restaurantRepository.update(id, {
      name: dto.name,
      description: dto.description,
      address: dto.address,
      phone: dto.phone,
    });

    return this.toResponseDto(updated);
  }

  /**
   * Check if restaurant can receive orders
   * CRITICAL: Enforces visibility rules
   */
  async canReceiveOrders(restaurantId: string): Promise<boolean> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      return false;
    }

    // Must be active
    if (!restaurant.isActive()) {
      return false;
    }

    // Must have valid subscription
    const subscription = await this.subscriptionRepository.findActiveByRestaurantId(restaurantId);
    return subscription !== null && subscription.isValid();
  }

  private toResponseDto(restaurant: Restaurant): RestaurantResponseDto {
    return {
      id: restaurant.id,
      name: restaurant.name,
      description: restaurant.description,
      address: restaurant.address,
      phone: restaurant.phone,
      status: restaurant.status,
      visibility: restaurant.visibility,
      isVisible: restaurant.isVisible,
      createdAt: restaurant.createdAt,
      updatedAt: restaurant.updatedAt,
    };
  }
}
