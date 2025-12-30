// Restaurant Dashboard Use Cases - Order Management
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
  IAuditLogRepository,
  AUDIT_LOG_REPOSITORY,
  AuditAction,
} from '../../../domain/repositories/audit-log.repository.interface';
import { OrderResponseDto } from '../../dtos/order.dto';
import { Order, OrderStatus } from '../../../domain/entities/order.entity';
import { IdempotencyService } from '../../../infrastructure/cache/idempotency.service';

@Injectable()
export class RestaurantDashboardUseCase {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Get all orders for a restaurant
   */
  async getOrders(
    restaurantId: string,
    ownerId: string,
    statuses?: OrderStatus[],
  ): Promise<OrderResponseDto[]> {
    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to view this restaurant');
    }

    const orders = statuses
      ? await this.orderRepository.findByRestaurantIdAndStatus(
          restaurantId,
          statuses,
        )
      : await this.orderRepository.findByRestaurantId(restaurantId);

    return orders.map((o) => this.toOrderResponseDto(o));
  }

  /**
   * Get pending orders for a restaurant
   */
  async getPendingOrders(
    restaurantId: string,
    ownerId: string,
  ): Promise<OrderResponseDto[]> {
    return this.getOrders(restaurantId, ownerId, [OrderStatus.PENDING]);
  }

  /**
   * Get active orders for a restaurant (accepted but not delivered/cancelled)
   */
  async getActiveOrders(
    restaurantId: string,
    ownerId: string,
  ): Promise<OrderResponseDto[]> {
    return this.getOrders(restaurantId, ownerId, [
      OrderStatus.ACCEPTED,
      OrderStatus.CONFIRMED,
      OrderStatus.PREPARING,
      OrderStatus.READY,
    ]);
  }

  /**
   * Accept an order (Restaurant action)
   * Idempotent operation
   */
  async acceptOrder(
    orderId: string,
    ownerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as OrderResponseDto;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      order.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to manage this order');
    }

    // Check if already accepted (idempotent)
    if (order.isAccepted()) {
      const response = this.toOrderResponseDto(order);
      await this.idempotencyService.store(idempotencyKey, 200, response);
      return response;
    }

    // Validate transition
    if (!order.canBeAccepted()) {
      throw new BadRequestException(
        `Cannot accept order in status ${order.status}. Valid transitions: ${order.getValidNextStates().join(', ') || 'none'}`,
      );
    }

    const previousState = order.toJSON();

    const updatedOrder = await this.orderRepository.updateStatus(
      orderId,
      OrderStatus.ACCEPTED,
    );

    const response = this.toOrderResponseDto(updatedOrder);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 200, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ORDER_ACCEPTED,
      entityType: 'Order',
      entityId: orderId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedOrder.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        restaurantId: order.restaurantId,
        actorType: 'restaurant',
      },
    });

    return response;
  }

  /**
   * Reject an order with reason (Restaurant action)
   * Idempotent operation
   */
  async rejectOrder(
    orderId: string,
    reason: string,
    ownerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Rejection reason is required');
    }

    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as OrderResponseDto;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      order.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to manage this order');
    }

    // Check if already rejected (idempotent)
    if (order.isRejected()) {
      const response = this.toOrderResponseDto(order);
      await this.idempotencyService.store(idempotencyKey, 200, response);
      return response;
    }

    // Validate transition
    if (!order.canBeRejected()) {
      throw new BadRequestException(
        `Cannot reject order in status ${order.status}. Valid transitions: ${order.getValidNextStates().join(', ') || 'none'}`,
      );
    }

    const previousState = order.toJSON();

    const updatedOrder = await this.orderRepository.updateOrderWithReason(
      orderId,
      {
        status: OrderStatus.REJECTED,
        rejectionReason: reason,
      },
    );

    const response = this.toOrderResponseDto(updatedOrder);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 200, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ORDER_REJECTED,
      entityType: 'Order',
      entityId: orderId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedOrder.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        restaurantId: order.restaurantId,
        rejectionReason: reason,
        actorType: 'restaurant',
      },
    });

    return response;
  }

  /**
   * Cancel an order with optional reason (Restaurant action)
   * Idempotent operation
   */
  async cancelOrder(
    orderId: string,
    reason: string | undefined,
    ownerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as OrderResponseDto;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      order.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to manage this order');
    }

    // Check if already cancelled (idempotent)
    if (order.isCancelled()) {
      const response = this.toOrderResponseDto(order);
      await this.idempotencyService.store(idempotencyKey, 200, response);
      return response;
    }

    // Validate transition
    if (!order.canBeCancelled()) {
      throw new BadRequestException(
        `Cannot cancel order in status ${order.status}. Valid transitions: ${order.getValidNextStates().join(', ') || 'none'}`,
      );
    }

    const previousState = order.toJSON();

    const updatedOrder = await this.orderRepository.updateOrderWithReason(
      orderId,
      {
        status: OrderStatus.CANCELLED,
        cancellationReason: reason || null,
      },
    );

    const response = this.toOrderResponseDto(updatedOrder);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 200, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ORDER_CANCELLED,
      entityType: 'Order',
      entityId: orderId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedOrder.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        restaurantId: order.restaurantId,
        cancellationReason: reason,
        actorType: 'restaurant',
      },
    });

    return response;
  }

  /**
   * Report an order with reason (Restaurant action)
   * Idempotent operation
   */
  async reportOrder(
    orderId: string,
    reason: string,
    ownerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    if (!reason || reason.trim() === '') {
      throw new BadRequestException('Report reason is required');
    }

    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as OrderResponseDto;
    }

    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      order.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to manage this order');
    }

    // Check if already reported (idempotent)
    if (order.isReported()) {
      const response = this.toOrderResponseDto(order);
      await this.idempotencyService.store(idempotencyKey, 200, response);
      return response;
    }

    // Validate transition
    if (!order.canBeReported()) {
      throw new BadRequestException(
        `Cannot report order in status ${order.status}. Valid transitions: ${order.getValidNextStates().join(', ') || 'none'}`,
      );
    }

    const previousState = order.toJSON();

    const updatedOrder = await this.orderRepository.updateOrderWithReason(
      orderId,
      {
        status: OrderStatus.REPORTED,
        reportReason: reason,
      },
    );

    const response = this.toOrderResponseDto(updatedOrder);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 200, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.ORDER_REPORTED,
      entityType: 'Order',
      entityId: orderId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedOrder.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        restaurantId: order.restaurantId,
        reportReason: reason,
        actorType: 'restaurant',
      },
    });

    return response;
  }

  /**
   * Update order status (generic status transition)
   */
  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
    ownerId: string,
    correlationId?: string,
  ): Promise<OrderResponseDto> {
    const order = await this.orderRepository.findById(orderId);
    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      order.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to manage this order');
    }

    // Validate transition
    if (!order.canTransitionTo(status)) {
      throw new BadRequestException(
        `Cannot transition order from ${order.status} to ${status}. Valid transitions: ${order.getValidNextStates().join(', ') || 'none'}`,
      );
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
        actorType: 'restaurant',
      },
    });

    return this.toOrderResponseDto(updatedOrder);
  }

  private toOrderResponseDto(order: Order): OrderResponseDto {
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
