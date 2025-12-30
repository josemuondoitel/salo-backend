// Restaurant Dashboard Controller - Order Management
// Isolated routes for restaurant owners to manage their orders
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { RestaurantDashboardUseCase } from '../../../application/use-cases/restaurant-dashboard/restaurant-dashboard.use-case';
import { OrderResponseDto } from '../../../application/dtos/order.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';
import { RestaurantOwnerGuard } from '../../guards/restaurant-owner.guard';
import { OrderStatus } from '../../../domain/entities/order.entity';
import { IsString, IsOptional, IsEnum } from 'class-validator';

class RejectOrderDto {
  @IsString()
  reason!: string;
}

class CancelOrderDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

class ReportOrderDto {
  @IsString()
  reason!: string;
}

class UpdateOrderStatusDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}

@Controller('api/v1/dashboard/restaurants/:restaurantId/orders')
@Roles('RESTAURANT_OWNER')
@UseGuards(RestaurantOwnerGuard)
export class RestaurantDashboardOrderController {
  constructor(
    private readonly restaurantDashboardUseCase: RestaurantDashboardUseCase,
  ) {}

  /**
   * Get all orders for this restaurant
   */
  @Get()
  async findAll(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('status') status?: string,
  ): Promise<OrderResponseDto[]> {
    const statuses = status ? (status.split(',') as OrderStatus[]) : undefined;
    return this.restaurantDashboardUseCase.getOrders(
      restaurantId,
      user.sub,
      statuses,
    );
  }

  /**
   * Get pending orders for this restaurant
   */
  @Get('pending')
  async findPending(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto[]> {
    return this.restaurantDashboardUseCase.getPendingOrders(
      restaurantId,
      user.sub,
    );
  }

  /**
   * Get active orders for this restaurant
   */
  @Get('active')
  async findActive(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<OrderResponseDto[]> {
    return this.restaurantDashboardUseCase.getActiveOrders(
      restaurantId,
      user.sub,
    );
  }

  /**
   * Accept an order
   * REQUIRES: Idempotency-Key header
   */
  @Post(':orderId/accept')
  @HttpCode(HttpStatus.OK)
  async acceptOrder(
    @Param('orderId') orderId: string,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<OrderResponseDto> {
    return this.restaurantDashboardUseCase.acceptOrder(
      orderId,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Reject an order with reason
   * REQUIRES: Idempotency-Key header
   */
  @Post(':orderId/reject')
  @HttpCode(HttpStatus.OK)
  async rejectOrder(
    @Param('orderId') orderId: string,
    @Body() dto: RejectOrderDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<OrderResponseDto> {
    return this.restaurantDashboardUseCase.rejectOrder(
      orderId,
      dto.reason,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Cancel an order with optional reason
   * REQUIRES: Idempotency-Key header
   */
  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(
    @Param('orderId') orderId: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<OrderResponseDto> {
    return this.restaurantDashboardUseCase.cancelOrder(
      orderId,
      dto.reason,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Report an order with reason
   * REQUIRES: Idempotency-Key header
   */
  @Post(':orderId/report')
  @HttpCode(HttpStatus.OK)
  async reportOrder(
    @Param('orderId') orderId: string,
    @Body() dto: ReportOrderDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<OrderResponseDto> {
    return this.restaurantDashboardUseCase.reportOrder(
      orderId,
      dto.reason,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Update order status (generic status transition)
   */
  @Post(':orderId/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ): Promise<OrderResponseDto> {
    return this.restaurantDashboardUseCase.updateOrderStatus(
      orderId,
      dto.status,
      user.sub,
      req.correlationId,
    );
  }
}
