// Domain Repository Interface - Audit Log

export enum AuditAction {
  SUBSCRIPTION_CREATED = 'SUBSCRIPTION_CREATED',
  SUBSCRIPTION_ACTIVATED = 'SUBSCRIPTION_ACTIVATED',
  SUBSCRIPTION_EXPIRED = 'SUBSCRIPTION_EXPIRED',
  SUBSCRIPTION_CANCELLED = 'SUBSCRIPTION_CANCELLED',
  RESTAURANT_ACTIVATED = 'RESTAURANT_ACTIVATED',
  RESTAURANT_SUSPENDED = 'RESTAURANT_SUSPENDED',
  RESTAURANT_CREATED = 'RESTAURANT_CREATED',
  ORDER_CREATED = 'ORDER_CREATED',
  ORDER_UPDATED = 'ORDER_UPDATED',
  PAYMENT_VALIDATED = 'PAYMENT_VALIDATED',
  PAYMENT_REJECTED = 'PAYMENT_REJECTED',
  ADMIN_ACTION = 'ADMIN_ACTION',
}

export interface AuditLogEntry {
  id: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  correlationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string | null;
  createdAt: Date;
}

export interface CreateAuditLogData {
  action: AuditAction;
  entityType: string;
  entityId: string;
  previousState?: Record<string, unknown> | null;
  newState?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  correlationId: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId?: string | null;
}

export interface IAuditLogRepository {
  create(data: CreateAuditLogData): Promise<AuditLogEntry>;
  findByEntityId(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogEntry[]>;
  findByCorrelationId(correlationId: string): Promise<AuditLogEntry[]>;
  findByAction(action: AuditAction): Promise<AuditLogEntry[]>;
}

export const AUDIT_LOG_REPOSITORY = Symbol('AUDIT_LOG_REPOSITORY');
