# SALO Backend - Architecture Update

## Version 2.0 - Major Features Added

This document describes the new features and architectural changes in the SALO backend.

## New Prisma Models

### Admin (Separate Table)
```prisma
model Admin {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String
  firstName     String
  lastName      String
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
}
```

### CloudinaryMedia
```prisma
model CloudinaryMedia {
  id              String    @id @default(uuid())
  publicId        String    @unique
  secureUrl       String
  mediaType       MediaType
  entityType      String
  entityId        String
  idempotencyKey  String    @unique
}
```

### Ledger (Double Entry Accounting)
```prisma
model LedgerAccount { ... }
model LedgerTransaction { ... }
model LedgerEntry { ... }
```

### AnalyticsEvent
```prisma
model AnalyticsEvent {
  id              String              @id @default(uuid())
  eventType       AnalyticsEventType
  restaurantId    String
  menuItemId      String?
  idempotencyKey  String              @unique
}
```

## Updated DDD Boundaries

### Domain Layer
- `entities/admin.entity.ts` - Admin entity (separate from User)
- `entities/cloudinary-media.entity.ts` - Media metadata
- `entities/ledger-account.entity.ts` - Ledger accounts
- `entities/ledger-transaction.entity.ts` - Transactions and entries
- `entities/analytics-event.entity.ts` - Analytics events

### Application Layer
- `use-cases/admin-auth/` - Separate admin authentication
- `use-cases/admin-analytics/` - Platform analytics
- `use-cases/analytics/` - Restaurant analytics
- `use-cases/ledger/` - Double-entry accounting
- `use-cases/media/` - Cloudinary integration

### Infrastructure Layer
- `security/admin-jwt.strategy.ts` - Separate JWT for admins
- `security/google-auth.service.ts` - Google OAuth verification
- `media/cloudinary.service.ts` - Cloudinary signed uploads

### Presentation Layer
- `controllers/v1/admin-auth.controller.ts` - `/api/v1/admin/auth`
- `controllers/v1/admin-analytics.controller.ts` - `/api/v1/admin/analytics`
- `controllers/v1/analytics.controller.ts` - `/api/v1/analytics`
- `controllers/v1/media.controller.ts` - `/api/v1/media`

## New Routes (Versioned)

### Admin Authentication (Separate)
- `POST /api/v1/admin/auth/login` - Admin login (separate JWT)

### Admin Analytics
- `GET /api/v1/admin/analytics/platform-stats` - Platform statistics
- `GET /api/v1/admin/analytics/revenue` - Revenue proxy metrics
- `GET /api/v1/admin/analytics/growth` - Growth metrics
- `GET /api/v1/admin/analytics/daily-orders` - Daily order counts

### Restaurant Analytics
- `POST /api/v1/analytics/events` - Track analytics event (idempotent)
- `GET /api/v1/analytics/restaurants/:id` - Restaurant metrics
- `GET /api/v1/analytics/dishes/:id` - Dish metrics

### Media (Cloudinary)
- `POST /api/v1/media/signed-upload-params` - Get signed upload params
- `POST /api/v1/media/metadata` - Store media metadata (idempotent)
- `GET /api/v1/media` - Get media by entity

### Google OAuth
- `POST /api/v1/auth/google` - Google login with id_token

## Security Implications

### Admin Separation
1. **Separate Table**: Admins stored in `admins` table, NOT `users`
2. **Separate JWT**: Uses `ADMIN_JWT_SECRET`, separate from user JWT
3. **Separate Issuer**: JWT includes `iss: 'salo-admin'` claim
4. **Audit Trail**: All admin actions logged to `AdminAuditLog`

### Cloudinary
1. **No Binary Storage**: Backend never handles binary files
2. **Signed Uploads**: Backend generates signed params, frontend uploads directly
3. **Credential Protection**: Cloudinary secrets only in backend env vars

### Google OAuth
1. **Token Verification**: Backend verifies id_token with Google
2. **Frontend Responsibility**: OAuth flow handled by frontend (Next.js)
3. **User Mapping**: Creates or maps user from Google identity

## Performance Considerations

### Analytics Queries
- All analytics tables have indexes on:
  - `restaurantId`
  - `menuItemId`
  - `eventType`
  - `createdAt`

### Ledger Queries
- Indexes on account IDs for balance calculations
- Append-only (no updates/deletes) for consistency

### Media Queries
- Indexes on `entityType, entityId` for efficient lookups
- Indexes on `publicId` and `idempotencyKey` for uniqueness

## Backward Compatibility

### No Breaking Changes
- All existing endpoints remain functional
- User authentication unchanged
- Existing Prisma models extended (not modified)

### Schema Additions
- `User.googleId` - Optional field for Google OAuth
- `User.authProvider` - Default 'local', supports 'google'
- `User.passwordHash` - Now nullable for Google-only users
- `Restaurant.profileImageId/Url` - Optional media references
- `MenuItem.imageId/Url` - Optional media references
- `Subscription.ledgerTransactionId` - Ledger reference

## Migration Strategy

1. Run `prisma migrate dev` to create new tables
2. Initialize ledger accounts with `LedgerUseCase.initializeAccounts()`
3. Deploy new code - all endpoints available immediately
4. No data migration required - new features are additive

## Environment Variables Added

```env
# Admin Authentication (SEPARATE)
ADMIN_JWT_SECRET=your-admin-jwt-secret
ADMIN_JWT_EXPIRATION=4h
ADMIN_JWT_ISSUER=salo-admin

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
```

## Idempotency Coverage

Extended idempotency to:
1. ✅ Analytics event ingestion
2. ✅ Ledger transaction writes
3. ✅ Cloudinary metadata persistence
4. ✅ Admin subscription activation (existing)
