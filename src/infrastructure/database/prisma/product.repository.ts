// Product Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IProductRepository,
  CreateProductData,
  UpdateProductData,
} from '../../../domain/repositories/product.repository.interface';
import {
  Product,
  ProductStatus,
} from '../../../domain/entities/product.entity';
import { Prisma } from '@prisma/client';

type ProductData = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  quantity: number;
  status: string;
  imageId: string | null;
  imageUrl: string | null;
  isFeatured: boolean;
  sortOrder: number;
  metadata: Prisma.JsonValue;
  deletedAt: Date | null;
  restaurantId: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: ProductData): Product {
    return new Product({
      id: data.id,
      name: data.name,
      description: data.description,
      price: data.price.toNumber(),
      quantity: data.quantity,
      status: data.status as ProductStatus,
      imageId: data.imageId,
      imageUrl: data.imageUrl,
      isFeatured: data.isFeatured,
      sortOrder: data.sortOrder,
      metadata: data.metadata as Record<string, unknown> | null,
      deletedAt: data.deletedAt,
      restaurantId: data.restaurantId,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string, includeDeleted = false): Promise<Product | null> {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
    });
    return product ? this.toDomain(product) : null;
  }

  async findByRestaurantId(
    restaurantId: string,
    includeDeleted = false,
  ): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        restaurantId,
        ...(includeDeleted ? {} : { deletedAt: null }),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return products.map((p) => this.toDomain(p));
  }

  async findVisibleByRestaurantId(restaurantId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        restaurantId,
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return products.map((p) => this.toDomain(p));
  }

  async findFeaturedByRestaurantId(restaurantId: string): Promise<Product[]> {
    const products = await this.prisma.product.findMany({
      where: {
        restaurantId,
        status: ProductStatus.ACTIVE,
        isFeatured: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
    return products.map((p) => this.toDomain(p));
  }

  async create(data: CreateProductData): Promise<Product> {
    const product = await this.prisma.product.create({
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        quantity: data.quantity ?? 0,
        status: data.status ?? ProductStatus.ACTIVE,
        imageId: data.imageId,
        imageUrl: data.imageUrl,
        isFeatured: data.isFeatured ?? false,
        sortOrder: data.sortOrder ?? 0,
        metadata:
          data.metadata === null || data.metadata === undefined
            ? Prisma.DbNull
            : (data.metadata as Prisma.InputJsonValue),
        restaurantId: data.restaurantId,
      },
    });
    return this.toDomain(product);
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    const updateData: Prisma.ProductUpdateInput = {};

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.quantity !== undefined) updateData.quantity = data.quantity;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.imageId !== undefined) updateData.imageId = data.imageId;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;
    if (data.metadata !== undefined)
      updateData.metadata =
        data.metadata === null
          ? Prisma.DbNull
          : (data.metadata as Prisma.InputJsonValue);

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    return this.toDomain(product);
  }

  async softDelete(id: string): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return this.toDomain(product);
  }

  async restore(id: string): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: { deletedAt: null },
    });
    return this.toDomain(product);
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    const product = await this.prisma.product.update({
      where: { id },
      data: { status },
    });
    return this.toDomain(product);
  }
}
