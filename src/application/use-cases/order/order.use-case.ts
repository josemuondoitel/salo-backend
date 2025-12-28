// Order Use Cases
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../../domain/repositories/order.repository.interface';
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
import { CreateOrderDto, OrderResponseDto } from '../../dtos/order.dto';
import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { IdempotencyService } from '../../../infrastructure/cache/idempotency.service';
import { PrismaService } from '../../../infrastructure/database/prisma/prisma.service';

@Injectable()
export class OrderUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly idempotencyService: IdempotencyService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new order
   * CRITICAL: This requires idempotency enforcement
   * CRITICAL: Restaurant must be ACTIVE and have valid subscription
   */
  async create(
    dto: CreateOrderDto,
    customerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as OrderResponseDto;
    }

    // Check if order already exists with this idempotency key
    const existingOrder =
      await this.orderRepository.findByIdempotencyKey(idempotencyKey);
    if (existingOrder) {
      return this.toResponseDto(existingOrder);
    }

    // Validate restaurant can receive orders
    const restaurant = await this.restaurantRepository.findById(
      dto.restaurantId,
    );
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }

    /**
     * VISIBILITY ENFORCEMENT - ZERO TOLERANCE
     * Restaurant MUST be ACTIVE to receive orders
     */
    if (!restaurant.isActive()) {
      throw new ForbiddenException(
        'Restaurant is not accepting orders. Status: ' + restaurant.status,
      );
    }

    /**
     * SUBSCRIPTION VALIDATION
     * Restaurant MUST have valid subscription to receive orders
     */
    const subscription =
      await this.subscriptionRepository.findActiveByRestaurantId(
        dto.restaurantId,
      );
    if (!subscription || !subscription.isValid()) {
      throw new ForbiddenException(
        'Restaurant subscription is not active or has expired',
      );
    }

    // Calculate total amount from menu items
    let totalAmount = 0;
    const orderItems: {
      menuItemId: string;
      quantity: number;
      unitPrice: number;
    }[] = [];

    for (const item of dto.items) {
      const menuItem = await this.prisma.menuItem.findUnique({
        where: { id: item.menuItemId },
      });

      if (!menuItem) {
        throw new NotFoundException(`Menu item ${item.menuItemId} not found`);
      }

      if (!menuItem.isAvailable) {
        throw new BadRequestException(
          `Menu item ${menuItem.name} is not available`,
        );
      }

      if (menuItem.restaurantId !== dto.restaurantId) {
        throw new BadRequestException(
          `Menu item ${item.menuItemId} does not belong to this restaurant`,
        );
      }

      const unitPrice = menuItem.price.toNumber();
      totalAmount += unitPrice * item.quantity;

      orderItems.push({
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice,
      });
    }

    // Create order
    const order = await this.orderRepository.create({
      customerId,
      restaurantId: dto.restaurantId,
      items: orderItems,
      notes: dto.notes,
      idempotencyKey,
      totalAmount,
    });

    const response = this.toResponseDto(order);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 201, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ORDER_CREATED,
      entityType: 'Order',
      entityId: order.id,
      newState: order.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: customerId,
      metadata: {
        restaurantId: dto.restaurantId,
        totalAmount,
        itemCount: orderItems.length,
      },
    });

    return response;
  }

  /**
   * Get order by ID
   */
  async findById(orderId: string, userId: string): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Check access - customer or restaurant owner
    if (order.customerId !== userId) {
      const restaurant = await this.restaurantRepository.findById(
        order.restaurantId,
      );
      if (!restaurant || restaurant.ownerId !== userId) {
        throw new ForbiddenException('Not authorized to view this order');
      }
    }

    return this.toResponseDto(order);
  }

  /**
   * Get orders by customer
   */
  async findByCustomerId(customerId: string): Promise<OrderResponseDto[]> {
    const orders = await this.orderRepository.findByCustomerId(customerId);
    return orders.map((o) => this.toResponseDto(o));
  }

  /**
   * Get orders by restaurant
   */
  async findByRestaurantId(
    restaurantId: string,
    ownerId: string,
  ): Promise<OrderResponseDto[]> {
    // Verify restaurant ownership
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException(
        'Not authorized to view orders for this restaurant',
      );
    }

    const orders = await this.orderRepository.findByRestaurantId(restaurantId);
    return orders.map((o) => this.toResponseDto(o));
  }

  /**
   * Update order status (Restaurant owner only)
   */
  async updateStatus(
    orderId: string,
    status: OrderStatus,
    ownerId: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify restaurant ownership
    const restaurant = await this.restaurantRepository.findById(
      order.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to update this order');
    }

    const previousState = order.toJSON();
    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      status,
    );

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ORDER_UPDATED,
      entityType: 'Order',
      entityId: orderId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedOrder.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        previousStatus: previousState.status,
        newStatus: status,
      },
    });

    return this.toResponseDto(updatedOrder);
  }

  private toResponseDto(order: Order): OrderResponseDto {
    return {
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      notes: order.notes,
      customerId: order.customerId,
      restaurantId: order.restaurantId,
      items: order.items.map((item) => ({
        id: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
