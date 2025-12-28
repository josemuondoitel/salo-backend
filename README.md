# SALO Backend

## B2B2C Food Platform Backend

SALO is a B2B2C food platform where:
- **Customers** discover restaurants, view menus, and place orders
- **Restaurants** pay a monthly subscription to remain active and visible
- **Admins** validate payments and manage the platform

## Core Value Proposition

> "We bring customers and visibility. You pay to stay active."

## Architecture Overview

This project follows **Domain-Driven Design (DDD)** with clear separation of concerns:

```
src/
├── domain/           # Pure business logic (framework-agnostic)
│   ├── entities/     # Business entities with domain logic
│   ├── repositories/ # Repository interfaces (ports)
│   └── value-objects/
├── application/      # Use Cases
│   ├── use-cases/    # Application services
│   ├── dtos/         # Data transfer objects
│   └── services/
├── infrastructure/   # External systems
│   ├── database/     # Prisma repositories
│   ├── cache/        # Redis services
│   ├── queue/        # BullMQ jobs
│   └── security/     # JWT, Auth
├── presentation/     # HTTP layer
│   ├── controllers/  # API v1 controllers
│   ├── guards/       # Auth guards
│   ├── decorators/   # Custom decorators
│   ├── interceptors/ # Correlation ID, etc.
│   └── filters/      # Exception filters
└── shared/           # Shared utilities
```

## Tech Stack

- **Framework**: NestJS with TypeScript strict mode
- **Database**: PostgreSQL with Prisma ORM
- **Cache/Queue**: Redis with BullMQ
- **Authentication**: JWT (1h expiry) with Passport
- **Rate Limiting**: Redis-backed throttling
- **Validation**: class-validator

## API Versioning

All endpoints are versioned from day zero:

```
/api/v1/auth/...
/api/v1/restaurants/...
/api/v1/subscriptions/...
/api/v1/orders/...
/api/v1/admin/...
/api/v1/health
```

## Key Features

### 1. Subscription Management
- Restaurants pay monthly subscriptions
- Admin validates payments (Express/Transfer)
- Automatic expiration checking (daily cron job)

### 2. Auto-Suspension
When a subscription expires:
- Restaurant status → `SUSPENDED`
- Visibility → `ZERO`
- Order creation → `BLOCKED`

### 3. Visibility Enforcement (Zero Tolerance)
- Visibility is **computed**, not stored
- Only `ACTIVE` restaurants with valid subscriptions are visible
- No manual override of visibility rules

### 4. Idempotency
State-changing endpoints require `X-Idempotency-Key` header:
- Order creation
- Subscription activation
- Admin actions

### 5. Audit Logging
All critical actions are logged:
- Subscription creation/activation/expiration
- Restaurant activation/suspension
- Order creation
- Payment validation

## Getting Started

### Prerequisites
- Node.js 20+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Start development server
npm run start:dev
```

### Environment Variables

Create a `.env` file:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/salo"
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your-secret-key
JWT_EXPIRATION=1h
PORT=3000
```

### Running Tests

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Docker

```bash
# Build image
docker build -t salo-backend .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=... \
  -e JWT_SECRET=... \
  -e REDIS_HOST=... \
  salo-backend
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login

### Restaurants
- `GET /api/v1/restaurants` - List visible restaurants (public)
- `POST /api/v1/restaurants` - Create restaurant (owner)
- `GET /api/v1/restaurants/:id` - Get restaurant
- `PUT /api/v1/restaurants/:id` - Update restaurant (owner)

### Subscriptions
- `POST /api/v1/subscriptions/restaurant/:id` - Create subscription
- `GET /api/v1/subscriptions/:id` - Get subscription
- `POST /api/v1/subscriptions/:id/cancel` - Cancel subscription

### Orders
- `POST /api/v1/orders` - Create order (requires X-Idempotency-Key)
- `GET /api/v1/orders/:id` - Get order
- `GET /api/v1/orders/my/orders` - Get my orders

### Admin
- `POST /api/v1/admin/subscriptions/:id/validate-payment` - Validate payment
- `POST /api/v1/admin/restaurants/:id/suspend` - Suspend restaurant
- `POST /api/v1/admin/jobs/subscription-expiration` - Trigger expiration check
- `GET /api/v1/admin/audit-logs` - Get audit logs

## Security

- JWT tokens with 1-hour expiry
- Role-based access control (CUSTOMER, RESTAURANT_OWNER, ADMIN)
- Redis-backed rate limiting
- Helmet security headers
- CORS configuration
- Idempotency enforcement
- Correlation IDs for request tracing

## License

UNLICENSED - Private
