// Product Use Cases
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IProductRepository,
  PRODUCT_REPOSITORY,
} from '../../../domain/repositories/product.repository.interface';
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
import {
  CreateProductDto,
  UpdateProductDto,
  ProductResponseDto,
} from '../../dtos/product.dto';
import {
  Product,
  ProductStatus,
} from '../../../domain/entities/product.entity';
import { IdempotencyService } from '../../../infrastructure/cache/idempotency.service';

@Injectable()
export class ProductUseCase {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly productRepository: IProductRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    @Inject(SUBSCRIPTION_REPOSITORY)
    private readonly subscriptionRepository: ISubscriptionRepository,
    @Inject(AUDIT_LOG_REPOSITORY)
    private readonly auditLogRepository: IAuditLogRepository,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Create a new product (Restaurant owner only)
   * Requires idempotency key
   */
  async create(
    dto: CreateProductDto,
    restaurantId: string,
    ownerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<ProductResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as ProductResponseDto;
    }

    // Verify restaurant ownership
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundException('Restaurant not found');
    }
    if (restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to manage this restaurant');
    }
    if (restaurant.isDeleted()) {
      throw new ForbiddenException('Restaurant has been deleted');
    }

    // Create product
    const product = await this.productRepository.create({
      name: dto.name,
      description: dto.description,
      price: dto.price,
      quantity: dto.quantity ?? 0,
      status: dto.status ?? ProductStatus.ACTIVE,
      imageId: dto.imageId,
      imageUrl: dto.imageUrl,
      isFeatured: dto.isFeatured ?? false,
      sortOrder: dto.sortOrder ?? 0,
      metadata: dto.metadata,
      restaurantId,
    });

    const response = this.toResponseDto(product);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 201, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.PRODUCT_CREATED,
      entityType: 'Product',
      entityId: product.id,
      newState: product.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        restaurantId,
        productName: dto.name,
      },
    });

    return response;
  }

  /**
   * Get product by ID
   * For public access, product must be visible (ACTIVE and not deleted)
   */
  async findById(
    productId: string,
    requesterId?: string,
    isPublic = false,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If public request, verify visibility
    if (isPublic) {
      if (!product.isVisible) {
        throw new NotFoundException('Product not found');
      }

      // Also check restaurant visibility
      const restaurant = await this.restaurantRepository.findById(
        product.restaurantId,
      );
      if (!restaurant || !restaurant.isActive()) {
        throw new NotFoundException('Product not found');
      }

      // Check subscription
      const subscription =
        await this.subscriptionRepository.findActiveByRestaurantId(
          product.restaurantId,
        );
      if (!subscription || !subscription.isValid()) {
        throw new NotFoundException('Product not found');
      }
    } else if (requesterId) {
      // For non-public requests, verify ownership
      const restaurant = await this.restaurantRepository.findById(
        product.restaurantId,
      );
      if (!restaurant || restaurant.ownerId !== requesterId) {
        throw new ForbiddenException('Not authorized to view this product');
      }
    }

    return this.toResponseDto(product);
  }

  /**
   * Get products by restaurant (owner view - includes all products)
   */
  async findByRestaurantId(
    restaurantId: string,
    ownerId: string,
    includeDeleted = false,
  ): Promise<ProductResponseDto[]> {
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to view this restaurant');
    }

    const products = await this.productRepository.findByRestaurantId(
      restaurantId,
      includeDeleted,
    );
    return products.map((p) => this.toResponseDto(p));
  }

  /**
   * Get visible products for public view
   * Only returns ACTIVE products for ACTIVE restaurants with valid subscriptions
   */
  async findVisibleByRestaurantId(
    restaurantId: string,
  ): Promise<ProductResponseDto[]> {
    // Check restaurant visibility
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || !restaurant.isActive()) {
      return [];
    }

    // Check subscription
    const subscription =
      await this.subscriptionRepository.findActiveByRestaurantId(restaurantId);
    if (!subscription || !subscription.isValid()) {
      return [];
    }

    const products =
      await this.productRepository.findVisibleByRestaurantId(restaurantId);
    return products.map((p) => this.toResponseDto(p));
  }

  /**
   * Get featured products for a restaurant
   */
  async findFeaturedByRestaurantId(
    restaurantId: string,
  ): Promise<ProductResponseDto[]> {
    // Check restaurant visibility
    const restaurant = await this.restaurantRepository.findById(restaurantId);
    if (!restaurant || !restaurant.isActive()) {
      return [];
    }

    // Check subscription
    const subscription =
      await this.subscriptionRepository.findActiveByRestaurantId(restaurantId);
    if (!subscription || !subscription.isValid()) {
      return [];
    }

    const products =
      await this.productRepository.findFeaturedByRestaurantId(restaurantId);
    return products.map((p) => this.toResponseDto(p));
  }

  /**
   * Update a product (Restaurant owner only)
   */
  async update(
    productId: string,
    dto: UpdateProductDto,
    ownerId: string,
    idempotencyKey: string,
    correlationId?: string,
  ): Promise<ProductResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as ProductResponseDto;
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      product.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to update this product');
    }

    const previousState = product.toJSON();

    const updatedProduct = await this.productRepository.update(productId, {
      name: dto.name,
      description: dto.description,
      price: dto.price,
      quantity: dto.quantity,
      status: dto.status,
      imageId: dto.imageId,
      imageUrl: dto.imageUrl,
      isFeatured: dto.isFeatured,
      sortOrder: dto.sortOrder,
      metadata: dto.metadata,
    });

    const response = this.toResponseDto(updatedProduct);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 200, response);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: productId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedProduct.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
    });

    return response;
  }

  /**
   * Update product status
   */
  async updateStatus(
    productId: string,
    status: ProductStatus,
    ownerId: string,
    correlationId?: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      product.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to update this product');
    }

    const previousState = product.toJSON();

    const updatedProduct = await this.productRepository.updateStatus(
      productId,
      status,
    );

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: productId,
      previousState: previousState as unknown as Record<string, unknown>,
      newState: updatedProduct.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        previousStatus: previousState.status,
        newStatus: status,
      },
    });

    return this.toResponseDto(updatedProduct);
  }

  /**
   * Soft delete a product (Restaurant owner only)
   */
  async softDelete(
    productId: string,
    ownerId: string,
    correlationId?: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      product.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to delete this product');
    }

    if (product.isDeleted()) {
      throw new BadRequestException('Product is already deleted');
    }

    const deletedProduct = await this.productRepository.softDelete(productId);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.PRODUCT_DELETED,
      entityType: 'Product',
      entityId: productId,
      previousState: product.toJSON() as unknown as Record<string, unknown>,
      newState: deletedProduct.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
    });

    return this.toResponseDto(deletedProduct);
  }

  /**
   * Restore a soft deleted product
   */
  async restore(
    productId: string,
    ownerId: string,
    correlationId?: string,
  ): Promise<ProductResponseDto> {
    const product = await this.productRepository.findById(productId, true);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Verify ownership
    const restaurant = await this.restaurantRepository.findById(
      product.restaurantId,
    );
    if (!restaurant || restaurant.ownerId !== ownerId) {
      throw new ForbiddenException('Not authorized to restore this product');
    }

    if (!product.isDeleted()) {
      throw new BadRequestException('Product is not deleted');
    }

    const restoredProduct = await this.productRepository.restore(productId);

    // Audit log
    await this.auditLogRepository.create({
      action: AuditAction.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: productId,
      previousState: product.toJSON() as unknown as Record<string, unknown>,
      newState: restoredProduct.toJSON() as unknown as Record<string, unknown>,
      correlationId: correlationId || uuidv4(),
      userId: ownerId,
      metadata: {
        action: 'restore',
      },
    });

    return this.toResponseDto(restoredProduct);
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      quantity: product.quantity,
      status: product.status,
      imageId: product.imageId,
      imageUrl: product.imageUrl,
      isFeatured: product.isFeatured,
      sortOrder: product.sortOrder,
      metadata: product.metadata,
      restaurantId: product.restaurantId,
      isVisible: product.isVisible,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
