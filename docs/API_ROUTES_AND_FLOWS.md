# SALO Backend - API Routes and Flows Documentation

## Overview

This document describes all API routes, access control, and business flows for the SALO B2B2C Food Platform backend.

---

## API Versioning

All routes are versioned with `/api/v1/` prefix.

---

## Authentication

### User Authentication
- **Strategy**: JWT Bearer Token
- **Header**: `Authorization: Bearer <token>`
- **Token Lifetime**: Configurable via `JWT_EXPIRATION` (default: 1h)

### Admin Authentication
- **Strategy**: Separate Admin JWT
- **Header**: `Authorization: Bearer <admin-token>`
- **Secret**: Uses `ADMIN_JWT_SECRET` (separate from user JWT)
- **Issuer**: `salo-admin`

---

## User Roles

| Role | Description |
|------|-------------|
| `CUSTOMER` | End customers who place orders |
| `RESTAURANT_OWNER` | Restaurant owners managing their restaurant |

> **Note**: `ADMIN` role has been removed from the UserRole enum. Admin access is now exclusively via the separate Admin table and AdminJwtStrategy.

---

## Public Routes (No Authentication Required)

### Health Check
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/health` | Health check endpoint |

### Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | User login |
| POST | `/api/v1/auth/google` | Google OAuth login |

### Restaurants (Public View)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/restaurants` | Get all visible restaurants (ACTIVE with valid subscription) |
| GET | `/api/v1/restaurants/:id` | Get restaurant by ID (visibility rules apply) |
| GET | `/api/v1/restaurants/:id/can-receive-orders` | Check if restaurant can receive orders |

### Products (Public View)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/products/restaurant/:restaurantId` | Get visible products for a restaurant |
| GET | `/api/v1/products/restaurant/:restaurantId/featured` | Get featured products |
| GET | `/api/v1/products/:id` | Get product by ID (visibility rules apply) |

---

## Customer Routes (CUSTOMER Role Required)

### Orders
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| POST | `/api/v1/orders` | Create new order | Required |
| GET | `/api/v1/orders/my/orders` | Get my orders | - |
| GET | `/api/v1/orders/:id` | Get order by ID | - |

---

## Restaurant Owner Routes (RESTAURANT_OWNER Role Required)

### Restaurant Management
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/restaurants` | Create restaurant |
| GET | `/api/v1/restaurants/me` | Get my restaurant |
| PUT | `/api/v1/restaurants/:id` | Update restaurant |

### Subscription Management
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| POST | `/api/v1/subscriptions` | Create subscription request | Required |
| GET | `/api/v1/subscriptions/my` | Get my subscription |

### Analytics
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| POST | `/api/v1/analytics/events` | Track analytics event | Required |
| GET | `/api/v1/analytics/restaurants/:id` | Get restaurant metrics | - |
| GET | `/api/v1/analytics/dishes/:id` | Get dish metrics | - |

### Media (Cloudinary)
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| POST | `/api/v1/media/signed-upload-params` | Get signed upload params | - |
| POST | `/api/v1/media/metadata` | Store media metadata | Required |
| GET | `/api/v1/media` | Get media by entity | - |

---

## Restaurant Dashboard Routes (Isolated)

These routes are dedicated for restaurant owners to manage their restaurant dashboard. They are isolated from public and admin routes.

### Product Management
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| POST | `/api/v1/dashboard/restaurants/:restaurantId/products` | Create product | Required |
| GET | `/api/v1/dashboard/restaurants/:restaurantId/products` | Get all products |  - |
| GET | `/api/v1/dashboard/restaurants/:restaurantId/products/:productId` | Get product by ID | - |
| PUT | `/api/v1/dashboard/restaurants/:restaurantId/products/:productId` | Update product | Required |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/products/:productId/status` | Update product status | - |
| DELETE | `/api/v1/dashboard/restaurants/:restaurantId/products/:productId` | Soft delete product | - |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/products/:productId/restore` | Restore deleted product | - |

### Order Management
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| GET | `/api/v1/dashboard/restaurants/:restaurantId/orders` | Get all orders | - |
| GET | `/api/v1/dashboard/restaurants/:restaurantId/orders/pending` | Get pending orders | - |
| GET | `/api/v1/dashboard/restaurants/:restaurantId/orders/active` | Get active orders | - |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/orders/:orderId/accept` | Accept order | Required |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/orders/:orderId/reject` | Reject order (with reason) | Required |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/orders/:orderId/cancel` | Cancel order (with optional reason) | Required |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/orders/:orderId/report` | Report order (with reason) | Required |
| POST | `/api/v1/dashboard/restaurants/:restaurantId/orders/:orderId/status` | Update order status | - |

---

## Admin Routes (Admin JWT Required)

### Admin Authentication
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/admin/auth/login` | Admin login (separate JWT) |

### Subscription Management
| Method | Route | Description | Idempotency |
|--------|-------|-------------|-------------|
| POST | `/api/v1/admin/subscriptions/:id/validate-payment` | Validate payment and activate subscription | Required |

### Restaurant Management
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/admin/restaurants/:id/suspend` | Suspend restaurant (with reason) |

### Jobs
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/admin/jobs/subscription-expiration` | Trigger subscription expiration check |

### Audit Logs
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/admin/audit-logs` | Get audit logs (query by entityType/entityId) |

### Queue Stats
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/admin/queue-stats` | Get queue statistics |

### Platform Analytics
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/admin/analytics/platform-stats` | Platform statistics |
| GET | `/api/v1/admin/analytics/revenue` | Revenue proxy metrics |
| GET | `/api/v1/admin/analytics/growth` | Growth metrics |
| GET | `/api/v1/admin/analytics/daily-orders` | Daily order counts |

---

## Order Lifecycle

### Order Status Flow (State Machine)

```
PENDING
   ├── ACCEPTED ──> CONFIRMED ──> PREPARING ──> READY ──> DELIVERED
   │      │             │             │           │           │
   │      │             │             │           │           │
   │      └─────────────┴─────────────┴───────────┴───────────┴──> REPORTED
   │
   ├── REJECTED (terminal)
   │
   └── CANCELLED (terminal - from PENDING, ACCEPTED, CONFIRMED, PREPARING)
```

### Valid Transitions

| From Status | Valid Next States |
|-------------|-------------------|
| PENDING | ACCEPTED, REJECTED, CANCELLED |
| ACCEPTED | CONFIRMED, CANCELLED, REPORTED |
| REJECTED | (terminal - no transitions) |
| CONFIRMED | PREPARING, CANCELLED, REPORTED |
| PREPARING | READY, CANCELLED, REPORTED |
| READY | DELIVERED, REPORTED |
| DELIVERED | REPORTED |
| CANCELLED | (terminal - no transitions) |
| REPORTED | (terminal - no transitions) |

### Restaurant Actions

| Action | Description | Reason Required |
|--------|-------------|-----------------|
| Accept | Restaurant accepts the order | No |
| Reject | Restaurant rejects the order | Yes |
| Cancel | Restaurant cancels the order | Optional |
| Report | Restaurant reports an issue | Yes |

---

## Product Lifecycle

### Product Status

| Status | Description | Visible |
|--------|-------------|---------|
| ACTIVE | Product is available | Yes |
| INACTIVE | Product is disabled | No |
| OUT_OF_STOCK | Product is out of stock | No |

### Soft Delete

Products support soft delete:
- `deletedAt` field is set when deleted
- Soft deleted products are excluded from queries by default
- Products can be restored via `/restore` endpoint

### Visibility Rules

A product is visible if:
1. Product status is `ACTIVE`
2. Product is NOT soft deleted (`deletedAt` is null)
3. Restaurant is `ACTIVE`
4. Restaurant has valid subscription

---

## User Journey

### Customer Journey

```
1. Browse restaurants (GET /api/v1/restaurants)
2. View restaurant products (GET /api/v1/products/restaurant/:id)
3. Register/Login (POST /api/v1/auth/register or /login)
4. Place order (POST /api/v1/orders) - requires Idempotency-Key
5. Track order (GET /api/v1/orders/:id)
6. View order history (GET /api/v1/orders/my/orders)
```

### Restaurant Owner Journey

```
1. Register with RESTAURANT_OWNER role (POST /api/v1/auth/register)
2. Create restaurant (POST /api/v1/restaurants)
3. Request subscription (POST /api/v1/subscriptions) - payment via Express/Transfer
4. Wait for admin payment validation
5. Once activated:
   a. Manage products (Dashboard routes)
   b. Manage orders (Dashboard routes)
   c. Track analytics
```

### Admin Journey

```
1. Login with admin credentials (POST /api/v1/admin/auth/login)
2. Validate payments (POST /api/v1/admin/subscriptions/:id/validate-payment)
3. Monitor platform:
   a. View analytics
   b. Check queue stats
   c. Review audit logs
4. Manage restaurants:
   a. Suspend problematic restaurants
   b. Trigger subscription expiration jobs
```

---

## Access Control Matrix

| Route Category | CUSTOMER | RESTAURANT_OWNER | ADMIN |
|----------------|----------|------------------|-------|
| Public Routes | ✓ | ✓ | ✓ |
| Customer Orders | ✓ | - | - |
| Restaurant Management | - | ✓ | - |
| Dashboard Products | - | ✓ | - |
| Dashboard Orders | - | ✓ | - |
| Admin Routes | - | - | ✓ |

---

## Idempotency

Operations that modify state require an `Idempotency-Key` header:

```
Idempotency-Key: <unique-uuid>
```

Idempotent operations:
- Order creation
- Product creation/update
- Order status changes (accept, reject, cancel, report)
- Analytics event tracking
- Media metadata persistence
- Subscription validation

---

## Audit Logging

All significant actions are logged:

| Action | Entity | Logged When |
|--------|--------|-------------|
| ORDER_CREATED | Order | New order placed |
| ORDER_ACCEPTED | Order | Restaurant accepts order |
| ORDER_REJECTED | Order | Restaurant rejects order |
| ORDER_CANCELLED | Order | Order is cancelled |
| ORDER_REPORTED | Order | Order is reported |
| ORDER_UPDATED | Order | Generic status change |
| PRODUCT_CREATED | Product | New product created |
| PRODUCT_UPDATED | Product | Product modified |
| PRODUCT_DELETED | Product | Product soft deleted |
| RESTAURANT_CREATED | Restaurant | New restaurant created |
| RESTAURANT_DELETED | Restaurant | Restaurant soft deleted |
| RESTAURANT_ACTIVATED | Restaurant | Restaurant activated |
| RESTAURANT_SUSPENDED | Restaurant | Restaurant suspended |
| SUBSCRIPTION_CREATED | Subscription | Subscription requested |
| SUBSCRIPTION_ACTIVATED | Subscription | Payment validated |
| SUBSCRIPTION_EXPIRED | Subscription | Subscription expired |
| PAYMENT_VALIDATED | Payment | Payment approved |
| PAYMENT_REJECTED | Payment | Payment rejected |

---

## Error Responses

All errors follow a consistent format:

```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "correlationId": "uuid"
}
```

### Common Status Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Missing/invalid token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Duplicate resource |
| 429 | Too Many Requests - Rate limited |
| 500 | Internal Server Error |

---

## Rate Limiting

Default limits (configurable via environment):
- TTL: 60 seconds
- Limit: 100 requests per TTL

---

## Correlation ID

All requests include a correlation ID for tracing:
- Header: `X-Correlation-ID`
- Auto-generated if not provided
- Included in all audit logs and error responses
