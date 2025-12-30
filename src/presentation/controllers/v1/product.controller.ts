// Product Controller - Public API v1
import { Controller, Get, Param } from '@nestjs/common';
import { ProductUseCase } from '../../../application/use-cases/product/product.use-case';
import { ProductResponseDto } from '../../../application/dtos/product.dto';
import { Public } from '../../decorators/public.decorator';

@Controller('api/v1/products')
export class ProductController {
  constructor(private readonly productUseCase: ProductUseCase) {}

  /**
   * Get visible products for a restaurant
   * PUBLIC - Only returns ACTIVE products for ACTIVE restaurants with valid subscriptions
   */
  @Public()
  @Get('restaurant/:restaurantId')
  async findByRestaurant(
    @Param('restaurantId') restaurantId: string,
  ): Promise<ProductResponseDto[]> {
    return this.productUseCase.findVisibleByRestaurantId(restaurantId);
  }

  /**
   * Get featured products for a restaurant
   * PUBLIC
   */
  @Public()
  @Get('restaurant/:restaurantId/featured')
  async findFeaturedByRestaurant(
    @Param('restaurantId') restaurantId: string,
  ): Promise<ProductResponseDto[]> {
    return this.productUseCase.findFeaturedByRestaurantId(restaurantId);
  }

  /**
   * Get product by ID
   * PUBLIC - But only visible products are returned
   */
  @Public()
  @Get(':id')
  async findById(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productUseCase.findById(id, undefined, true);
  }
}
