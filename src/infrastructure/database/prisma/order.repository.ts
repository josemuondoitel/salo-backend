// Order Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IOrderRepository,
  CreateOrderData,
  UpdateOrderStatusData,
} from '../../../domain/repositories/order.repository.interface';
import {
  Order,
  OrderStatus,
  OrderItemProps,
} from '../../../domain/entities/order.entity';
import { Prisma } from '@prisma/client';

type OrderWithItems = {
  id: string;
  status: string;
  totalAmount: Prisma.Decimal;
  notes: string | null;
  idempotencyKey: string;
  customerId: string;
  restaurantId: string;
  rejectionReason: string | null;
  reportReason: string | null;
  cancellationReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    quantity: number;
    unitPrice: Prisma.Decimal;
    menuItemId: string;
  }[];
};

@Injectable()
export class PrismaOrderRepository implements IOrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: OrderWithItems): Order {
    const items: OrderItemProps[] = data.items.map((item) => ({
      id: item.id,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber(),
      menuItemId: item.menuItemId,
    }));

    return new Order({
      id: data.id,
      status: data.status as OrderStatus,
      totalAmount: data.totalAmount.toNumber(),
      notes: data.notes,
      idempotencyKey: data.idempotencyKey,
      customerId: data.customerId,
      restaurantId: data.restaurantId,
      rejectionReason: data.rejectionReason,
      reportReason: data.reportReason,
      cancellationReason: data.cancellationReason,
      items,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    return order ? this.toDomain(order) : null;
  }

  async findByIdempotencyKey(key: string): Promise<Order | null> {
    const order = await this.prisma.order.findUnique({
      where: { idempotencyKey: key },
      include: { items: true },
    });
    return order ? this.toDomain(order) : null;
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { customerId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toDomain(o));
  }

  async findByRestaurantId(restaurantId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: { restaurantId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toDomain(o));
  }

  async findByRestaurantIdAndStatus(
    restaurantId: string,
    statuses: OrderStatus[],
  ): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        restaurantId,
        status: { in: statuses },
      },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((o) => this.toDomain(o));
  }

  async create(data: CreateOrderData): Promise<Order> {
    const order = await this.prisma.order.create({
      data: {
        customerId: data.customerId,
        restaurantId: data.restaurantId,
        totalAmount: data.totalAmount,
        notes: data.notes,
        idempotencyKey: data.idempotencyKey,
        status: OrderStatus.PENDING,
        items: {
          create: data.items.map((item) => ({
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: { items: true },
    });
    return this.toDomain(order);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });
    return this.toDomain(order);
  }

  async updateOrderWithReason(
    id: string,
    data: UpdateOrderStatusData,
  ): Promise<Order> {
    const updateData: Prisma.OrderUpdateInput = {
      status: data.status,
    };

    if (data.rejectionReason !== undefined) {
      updateData.rejectionReason = data.rejectionReason;
    }
    if (data.reportReason !== undefined) {
      updateData.reportReason = data.reportReason;
    }
    if (data.cancellationReason !== undefined) {
      updateData.cancellationReason = data.cancellationReason;
    }

    const order = await this.prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });
    return this.toDomain(order);
  }
}
