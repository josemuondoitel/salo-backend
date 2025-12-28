# SALO Backend - Risk Analysis & Scalability Notes

## Risk Analysis

### 1. Security Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| JWT Token Theft | High | 1-hour expiry, HTTPS only, secure storage guidance |
| SQL Injection | Critical | Prisma ORM with parameterized queries |
| Rate Limit Bypass | Medium | Redis-backed throttling with per-IP limits |
| Authentication Bypass | Critical | JWT validation on all protected routes |
| CSRF | Medium | Token-based auth eliminates CSRF risk |

### 2. Business Logic Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Subscription Expiration Failure | High | Daily cron job + manual trigger + audit logs |
| Duplicate Orders | High | Idempotency enforcement with Redis |
| Visibility Bypass | Critical | Computed visibility, not stored |
| Payment Fraud | High | Admin-only payment validation with audit trail |

### 3. Infrastructure Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Database Failure | High | Connection pooling, health checks |
| Redis Failure | Medium | Graceful degradation for non-critical features |
| Queue Processing Failure | Medium | BullMQ retry mechanism, dead letter queue |
| Memory Exhaustion | Medium | 512MB RAM compatible design |

### 4. Data Integrity Risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| Audit Log Tampering | High | Append-only audit logs, no updates/deletes |
| State Inconsistency | High | Database transactions for multi-step operations |
| Idempotency Collision | Low | UUID-based keys with 24h TTL |

## Angola-Specific Scalability Notes

### Network Considerations

1. **Intermittent Connectivity**
   - Idempotency ensures safe retries
   - Offline-first client design recommended
   - Request timeout configuration

2. **High Latency**
   - Optimized database queries
   - Response caching for static data
   - Pagination on all list endpoints

3. **Bandwidth Constraints**
   - Minimal response payloads
   - Gzip compression enabled
   - Image optimization for menus (client-side)

### Infrastructure Recommendations

1. **Database**
   - Primary in Luanda
   - Read replicas for scaling
   - Connection pooling (PgBouncer)

2. **Redis**
   - Single instance for small scale
   - Cluster for high availability
   - Local latency preferred

3. **Application Servers**
   - Horizontal scaling with load balancer
   - 512MB RAM per container
   - Auto-scaling based on CPU/memory

### Growth Projections

| Phase | Restaurants | Orders/Day | Infrastructure |
|-------|-------------|------------|----------------|
| Launch | 50-100 | 500-1000 | Single server, managed DB |
| 6 months | 500 | 5000 | 3-node cluster, Redis cluster |
| 1 year | 2000 | 20000 | K8s deployment, read replicas |
| 2 years | 10000 | 100000 | Multi-region, dedicated DBA |

### Payment Processing Notes

1. **Express/Transfer Only**
   - No online payment gateway initially
   - Manual admin validation
   - Clear audit trail for disputes

2. **Mobile Money Integration (Future)**
   - M-Pesa, Multicaixa Express consideration
   - Webhook-based payment confirmation
   - Retry mechanism for failed callbacks

### Localization Considerations

1. **Language Support**
   - Portuguese primary
   - English secondary
   - Internationalization framework ready

2. **Currency**
   - Kwanza (AOA) with decimal precision
   - Price stored as Decimal(10,2)

3. **Time Zones**
   - WAT (West Africa Time) consideration
   - UTC storage with local display

## Monitoring Recommendations

1. **Application Metrics**
   - Request latency (p50, p95, p99)
   - Error rates by endpoint
   - Queue depth and processing time

2. **Business Metrics**
   - Active subscriptions count
   - Daily order volume
   - Subscription expiration rate

3. **Infrastructure Metrics**
   - Database connection pool usage
   - Redis memory and hit rate
   - Container CPU/memory usage

## Disaster Recovery

1. **Database Backups**
   - Daily automated backups
   - Point-in-time recovery enabled
   - 30-day retention

2. **Application Recovery**
   - Stateless design enables quick restart
   - Health checks for auto-restart
   - Blue-green deployment capability

3. **Data Export**
   - Admin API for data export
   - GDPR-compliant data portability

## Compliance Notes

1. **Data Protection**
   - Password hashing with bcrypt (cost 12)
   - No plain-text storage
   - Audit logs for access tracking

2. **Financial Records**
   - Payment validation audit trail
   - Subscription history preserved
   - Admin action logging
