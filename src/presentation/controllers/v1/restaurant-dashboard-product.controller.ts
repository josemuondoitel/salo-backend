// Restaurant Dashboard Controller - Product Management
// Isolated routes for restaurant owners to manage their products
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { ProductUseCase } from '../../../application/use-cases/product/product.use-case';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
  UpdateProductStatusDto,
} from '../../../application/dtos/product.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';
import { RestaurantOwnerGuard } from '../../guards/restaurant-owner.guard';

@Controller('api/v1/dashboard/restaurants/:restaurantId/products')
@Roles('RESTAURANT_OWNER')
@UseGuards(RestaurantOwnerGuard)
export class RestaurantDashboardProductController {
  constructor(private readonly productUseCase: ProductUseCase) {}

  /**
   * Create a new product
   * REQUIRES: Idempotency-Key header
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('restaurantId') restaurantId: string,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<ProductResponseDto> {
    return this.productUseCase.create(
      dto,
      restaurantId,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Get all products for this restaurant (owner view)
   */
  @Get()
  async findAll(
    @Param('restaurantId') restaurantId: string,
    @CurrentUser() user: JwtPayload,
    @Query('includeDeleted') includeDeleted?: string,
  ): Promise<ProductResponseDto[]> {
    return this.productUseCase.findByRestaurantId(
      restaurantId,
      user.sub,
      includeDeleted === 'true',
    );
  }

  /**
   * Get a specific product
   */
  @Get(':productId')
  async findById(
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<ProductResponseDto> {
    return this.productUseCase.findById(productId, user.sub, false);
  }

  /**
   * Update a product
   * REQUIRES: Idempotency-Key header
   */
  @Put(':productId')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<ProductResponseDto> {
    return this.productUseCase.update(
      productId,
      dto,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Update product status
   */
  @Post(':productId/status')
  @HttpCode(HttpStatus.OK)
  async updateStatus(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductStatusDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ): Promise<ProductResponseDto> {
    return this.productUseCase.updateStatus(
      productId,
      dto.status,
      user.sub,
      req.correlationId,
    );
  }

  /**
   * Soft delete a product
   */
  @Delete(':productId')
  @HttpCode(HttpStatus.OK)
  async delete(
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ): Promise<ProductResponseDto> {
    return this.productUseCase.softDelete(
      productId,
      user.sub,
      req.correlationId,
    );
  }

  /**
   * Restore a soft deleted product
   */
  @Post(':productId/restore')
  @HttpCode(HttpStatus.OK)
  async restore(
    @Param('productId') productId: string,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ): Promise<ProductResponseDto> {
    return this.productUseCase.restore(productId, user.sub, req.correlationId);
  }
}
