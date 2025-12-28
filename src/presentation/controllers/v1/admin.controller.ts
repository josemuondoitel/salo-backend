// Admin Controller - API v1
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
} from '@nestjs/common';
import { Request } from 'express';
import { AdminUseCase } from '../../../application/use-cases/admin/admin.use-case';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { Roles } from '../../decorators/roles.decorator';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';
import { IsString, IsOptional } from 'class-validator';

class SuspendRestaurantDto {
  @IsString()
  reason!: string;
}

class ValidatePaymentDto {
  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller('api/v1/admin')
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminUseCase: AdminUseCase) {}

  /**
   * Validate payment and activate subscription
   * ADMIN ONLY
   * Requires idempotency key
   */
  @Post('subscriptions/:id/validate-payment')
  @HttpCode(HttpStatus.OK)
  async validatePayment(
    @Param('id') subscriptionId: string,
    @Body() _dto: ValidatePaymentDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
    @Req() req: Request & { correlationId?: string },
  ): Promise<{
    subscription: { id: string; status: string };
    restaurant: { id: string; status: string };
  }> {
    return this.adminUseCase.validatePayment(
      subscriptionId,
      user.sub,
      idempotencyKey,
      req.correlationId,
    );
  }

  /**
   * Manually suspend a restaurant
   * ADMIN ONLY
   */
  @Post('restaurants/:id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendRestaurant(
    @Param('id') restaurantId: string,
    @Body() dto: SuspendRestaurantDto,
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ): Promise<{ id: string; status: string }> {
    return this.adminUseCase.suspendRestaurant(
      restaurantId,
      user.sub,
      dto.reason,
      req.correlationId,
    );
  }

  /**
   * Trigger subscription expiration check
   * ADMIN ONLY
   */
  @Post('jobs/subscription-expiration')
  @HttpCode(HttpStatus.ACCEPTED)
  async triggerExpirationCheck(
    @CurrentUser() user: JwtPayload,
    @Req() req: Request & { correlationId?: string },
  ): Promise<{ jobId: string }> {
    return this.adminUseCase.triggerExpirationCheck(
      user.sub,
      req.correlationId,
    );
  }

  /**
   * Get audit logs for an entity
   * ADMIN ONLY
   */
  @Get('audit-logs')
  async getAuditLogs(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ): Promise<
    {
      action: string;
      entityType: string;
      entityId: string;
      createdAt: Date;
      userId: string | null;
    }[]
  > {
    return this.adminUseCase.getAuditLogs(entityType, entityId);
  }

  /**
   * Get queue statistics
   * ADMIN ONLY
   */
  @Get('queue-stats')
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
  }> {
    return this.adminUseCase.getQueueStats();
  }
}
