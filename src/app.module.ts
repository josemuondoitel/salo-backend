// SALO Backend - Main Application Module
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';

// Infrastructure
import { PrismaService } from './infrastructure/database/prisma/prisma.service';
import { PrismaUserRepository } from './infrastructure/database/prisma/user.repository';
import { PrismaRestaurantRepository } from './infrastructure/database/prisma/restaurant.repository';
import { PrismaSubscriptionRepository } from './infrastructure/database/prisma/subscription.repository';
import { PrismaOrderRepository } from './infrastructure/database/prisma/order.repository';
import { PrismaAuditLogRepository } from './infrastructure/database/prisma/audit-log.repository';
import { PrismaAdminRepository } from './infrastructure/database/prisma/admin.repository';
import { PrismaCloudinaryMediaRepository } from './infrastructure/database/prisma/cloudinary-media.repository';
import { PrismaLedgerRepository } from './infrastructure/database/prisma/ledger.repository';
import { PrismaAnalyticsRepository } from './infrastructure/database/prisma/analytics.repository';
import { RedisService } from './infrastructure/cache/redis.service';
import { IdempotencyService } from './infrastructure/cache/idempotency.service';
import { JwtStrategy } from './infrastructure/security/jwt.strategy';
import { AdminJwtStrategy } from './infrastructure/security/admin-jwt.strategy';
import { GoogleAuthService } from './infrastructure/security/google-auth.service';
import { CloudinaryService } from './infrastructure/media/cloudinary.service';
import {
  SubscriptionExpirationProcessor,
  SUBSCRIPTION_EXPIRATION_QUEUE,
} from './infrastructure/queue/subscription-expiration.processor';
import { QueueService } from './infrastructure/queue/queue.service';
import { ScheduledTasks } from './infrastructure/queue/scheduled-tasks';

// Domain Repository Tokens
import { USER_REPOSITORY } from './domain/repositories/user.repository.interface';
import { RESTAURANT_REPOSITORY } from './domain/repositories/restaurant.repository.interface';
import { SUBSCRIPTION_REPOSITORY } from './domain/repositories/subscription.repository.interface';
import { ORDER_REPOSITORY } from './domain/repositories/order.repository.interface';
import { AUDIT_LOG_REPOSITORY } from './domain/repositories/audit-log.repository.interface';
import { ADMIN_REPOSITORY } from './domain/repositories/admin.repository.interface';
import { CLOUDINARY_MEDIA_REPOSITORY } from './domain/repositories/cloudinary-media.repository.interface';
import { LEDGER_REPOSITORY } from './domain/repositories/ledger.repository.interface';
import { ANALYTICS_REPOSITORY } from './domain/repositories/analytics.repository.interface';

// Application Use Cases
import { AuthUseCase } from './application/use-cases/auth/auth.use-case';
import { RestaurantUseCase } from './application/use-cases/restaurant/restaurant.use-case';
import { SubscriptionUseCase } from './application/use-cases/subscription/subscription.use-case';
import { OrderUseCase } from './application/use-cases/order/order.use-case';
import { AdminUseCase } from './application/use-cases/admin/admin.use-case';
import { AdminAuthUseCase } from './application/use-cases/admin-auth/admin-auth.use-case';
import { AdminAnalyticsUseCase } from './application/use-cases/admin-analytics/admin-analytics.use-case';
import { AnalyticsUseCase } from './application/use-cases/analytics/analytics.use-case';
import { LedgerUseCase } from './application/use-cases/ledger/ledger.use-case';
import { MediaUseCase } from './application/use-cases/media/media.use-case';

// Presentation
import { AuthController } from './presentation/controllers/v1/auth.controller';
import { RestaurantController } from './presentation/controllers/v1/restaurant.controller';
import { SubscriptionController } from './presentation/controllers/v1/subscription.controller';
import { OrderController } from './presentation/controllers/v1/order.controller';
import { AdminController } from './presentation/controllers/v1/admin.controller';
import { HealthController } from './presentation/controllers/v1/health.controller';
import { AdminAuthController } from './presentation/controllers/v1/admin-auth.controller';
import { AdminAnalyticsController } from './presentation/controllers/v1/admin-analytics.controller';
import { AnalyticsController } from './presentation/controllers/v1/analytics.controller';
import { MediaController } from './presentation/controllers/v1/media.controller';
import { JwtAuthGuard } from './presentation/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/guards/roles.guard';
import { GlobalExceptionFilter } from './presentation/filters/global-exception.filter';
import { CorrelationIdInterceptor } from './presentation/interceptors/correlation-id.interceptor';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Passport & JWT
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const expiresIn = configService.get<string>('JWT_EXPIRATION') || '1h';
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn: expiresIn as
              | `${number}${'s' | 'm' | 'h' | 'd'}`
              | number,
          },
        };
      },
    }),

    // Rate Limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60000),
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    // BullMQ - Job Queue
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD') || undefined,
        },
      }),
    }),
    BullModule.registerQueue({
      name: SUBSCRIPTION_EXPIRATION_QUEUE,
    }),

    // Scheduler
    ScheduleModule.forRoot(),
  ],
  controllers: [
    AuthController,
    RestaurantController,
    SubscriptionController,
    OrderController,
    AdminController,
    HealthController,
    AdminAuthController,
    AdminAnalyticsController,
    AnalyticsController,
    MediaController,
  ],
  providers: [
    // Infrastructure Services
    PrismaService,
    RedisService,
    IdempotencyService,
    JwtStrategy,
    AdminJwtStrategy,
    GoogleAuthService,
    CloudinaryService,
    QueueService,
    ScheduledTasks,
    SubscriptionExpirationProcessor,

    // Repository Bindings (DDD - Infrastructure implements Domain interfaces)
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    { provide: RESTAURANT_REPOSITORY, useClass: PrismaRestaurantRepository },
    {
      provide: SUBSCRIPTION_REPOSITORY,
      useClass: PrismaSubscriptionRepository,
    },
    { provide: ORDER_REPOSITORY, useClass: PrismaOrderRepository },
    { provide: AUDIT_LOG_REPOSITORY, useClass: PrismaAuditLogRepository },
    { provide: ADMIN_REPOSITORY, useClass: PrismaAdminRepository },
    {
      provide: CLOUDINARY_MEDIA_REPOSITORY,
      useClass: PrismaCloudinaryMediaRepository,
    },
    { provide: LEDGER_REPOSITORY, useClass: PrismaLedgerRepository },
    { provide: ANALYTICS_REPOSITORY, useClass: PrismaAnalyticsRepository },

    // Application Use Cases
    AuthUseCase,
    RestaurantUseCase,
    SubscriptionUseCase,
    OrderUseCase,
    AdminUseCase,
    AdminAuthUseCase,
    AdminAnalyticsUseCase,
    AnalyticsUseCase,
    LedgerUseCase,
    MediaUseCase,

    // Global Guards
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: ThrottlerGuard },

    // Global Filters
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },

    // Global Interceptors
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
  ],
})
export class AppModule {}
