// Order Controller - API v1
import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { OrderUseCase } from '../../../application/use-cases/order/order.use-case';
import { CreateOrderDto, OrderResponseDto, UpdateOrderStatusDto } from '../../../application/dtos/order.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';
import { OrderStatus } from '../../../domain/entities/order.entity';

@Controller('api/v1/orders')
export class OrderController {
  constructor(private readonly orderUseCase: OrderUseCase) {}

  /**
   * Create a new order
   * CUSTOMER only
   * REQUIRES: Idempotency-Key header
   * ENFORCES: Restaurant must be ACTIVE with valid subscription
   */
  @Post()
  @Roles('CUSTOMER')
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateOrderDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string }
  ): Promise<OrderResponseDto> {
    return this.orderUseCase.create(dto, user.sub, idempotencyKey, req.correlationId);
  }

  /**
   * Get order by ID
   */
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload
  ): Promise<OrderResponseDto> {
    return this.orderUseCase.findById(id, user.sub);
  }

  /**
   * Get my orders (Customer)
   */
  @Get('my/orders')
  @Roles('CUSTOMER')
  async findMyOrders(@CurrentUser() user: JwtPayload): Promise<OrderResponseDto[]> {
    return this.orderUseCase.findByCustomerId(user.sub);
  }

  /**
   * Get orders for a restaurant
   * RESTAURANT_OWNER only
   */
  @Get('restaurant/:restaurantId')
  @Roles('RESTAURANT_OWNER')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtPayload
  ): Promise<OrderResponseDto[]> {
    return this.orderUseCase.findByRestaurantId(restaurantId, user.sub);
  }

  /**
   * Update order status
   * RESTAURANT_OWNER only
   */
  @Post(':id/status')
  @Roles('RESTAURANT_OWNER')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string }
  ): Promise<OrderResponseDto> {
    return this.orderUseCase.updateStatus(
      id,
      dto.status as OrderStatus,
      user.sub,
      req.correlationId
    );
  }
}
