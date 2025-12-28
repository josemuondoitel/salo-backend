// Restaurant Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IRestaurantRepository,
  CreateRestaurantData,
} from '../../../domain/repositories/restaurant.repository.interface';
import {
  Restaurant,
  RestaurantStatus,
} from '../../../domain/entities/restaurant.entity';

@Injectable()
export class PrismaRestaurantRepository implements IRestaurantRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: string;
    name: string;
    description: string | null;
    address: string;
    phone: string;
    status: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  }): Restaurant {
    return new Restaurant({
      id: data.id,
      name: data.name,
      description: data.description,
      address: data.address,
      phone: data.phone,
      status: data.status as RestaurantStatus,
      ownerId: data.ownerId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Restaurant | null> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
    });
    return restaurant ? this.toDomain(restaurant) : null;
  }

  async findByOwnerId(ownerId: string): Promise<Restaurant | null> {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { ownerId },
    });
    return restaurant ? this.toDomain(restaurant) : null;
  }

  /**
   * VISIBILITY ENFORCEMENT: Only returns ACTIVE restaurants with valid subscriptions
   * This is a critical query that enforces the zero-tolerance visibility rule
   */
  async findAllVisible(): Promise<Restaurant[]> {
    const now = new Date();

    const restaurants = await this.prisma.restaurant.findMany({
      where: {
        status: RestaurantStatus.ACTIVE,
        subscriptions: {
          some: {
            status: 'ACTIVE',
            endDate: { gt: now },
          },
        },
      },
    });

    return restaurants.map((r) => this.toDomain(r));
  }

  async findByStatus(status: RestaurantStatus): Promise<Restaurant[]> {
    const restaurants = await this.prisma.restaurant.findMany({
      where: { status },
    });
    return restaurants.map((r) => this.toDomain(r));
  }

  async create(data: CreateRestaurantData): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.create({
      data: {
        name: data.name,
        description: data.description,
        address: data.address,
        phone: data.phone,
        ownerId: data.ownerId,
        status: RestaurantStatus.PENDING,
      },
    });
    return this.toDomain(restaurant);
  }

  async updateStatus(
    id: string,
    status: RestaurantStatus,
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(restaurant);
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string | null;
      address: string;
      phone: string;
    }>,
  ): Promise<Restaurant> {
    const restaurant = await this.prisma.restaurant.update({
      where: { id },
      data,
    });
    return this.toDomain(restaurant);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.restaurant.delete({ where: { id } });
  }
}
