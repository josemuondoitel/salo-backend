// Restaurant Controller - API v1
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { RestaurantUseCase } from '../../../application/use-cases/restaurant/restaurant.use-case';
import { CreateRestaurantDto, UpdateRestaurantDto, RestaurantResponseDto } from '../../../application/dtos/restaurant.dto';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { Public } from '../../decorators/public.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';

@Controller('api/v1/restaurants')
export class RestaurantController {
  constructor(private readonly restaurantUseCase: RestaurantUseCase) {}

  /**
   * Create a new restaurant
   * Only RESTAURANT_OWNER can create
   */
  @Post()
  @Roles('RESTAURANT_OWNER')
  async create(
    @Body() dto: CreateRestaurantDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string }
  ): Promise<RestaurantResponseDto> {
    return this.restaurantUseCase.create(dto, user.sub, req.correlationId);
  }

  /**
   * Get all visible restaurants
   * PUBLIC - Only returns ACTIVE restaurants with valid subscriptions
   */
  @Public()
  @Get()
  async findAllVisible(): Promise<RestaurantResponseDto[]> {
    return this.restaurantUseCase.findAllVisible();
  }

  /**
   * Get my restaurant (for restaurant owners)
   */
  @Get('me')
  @Roles('RESTAURANT_OWNER')
  async findMine(@CurrentUser() user: JwtPayload): Promise<RestaurantResponseDto | null> {
    return this.restaurantUseCase.findByOwnerId(user.sub);
  }

  /**
   * Get restaurant by ID
   * PUBLIC - But only visible restaurants are returned for non-owners
   */
  @Public()
  @Get(':id')
  async findById(
    @Param('id') id: string,
    @CurrentUser() user?: JwtPayload
  ): Promise<RestaurantResponseDto> {
    return this.restaurantUseCase.findById(id, user?.sub);
  }

  /**
   * Update restaurant
   * Only owner can update
   */
  @Put(':id')
  @Roles('RESTAURANT_OWNER')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRestaurantDto,
    @CurrentUser() user: JwtPayload
  ): Promise<RestaurantResponseDto> {
    return this.restaurantUseCase.update(id, dto, user.sub);
  }

  /**
   * Check if restaurant can receive orders
   */
  @Public()
  @Get(':id/can-receive-orders')
  async canReceiveOrders(@Param('id') id: string): Promise<{ canReceiveOrders: boolean }> {
    const canReceive = await this.restaurantUseCase.canReceiveOrders(id);
    return { canReceiveOrders: canReceive };
  }
}
