// Audit Log Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IAuditLogRepository,
  AuditAction,
  AuditLogEntry,
  CreateAuditLogData,
} from '../../../domain/repositories/audit-log.repository.interface';

type PrismaAuditLog = {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  previousState: unknown;
  newState: unknown;
  metadata: unknown;
  correlationId: string;
  ipAddress: string | null;
  userAgent: string | null;
  userId: string | null;
  createdAt: Date;
};

@Injectable()
export class PrismaAuditLogRepository implements IAuditLogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: PrismaAuditLog): AuditLogEntry {
    return {
      id: data.id,
      action: data.action as AuditAction,
      entityType: data.entityType,
      entityId: data.entityId,
      previousState: data.previousState as Record<string, unknown> | null,
      newState: data.newState as Record<string, unknown> | null,
      metadata: data.metadata as Record<string, unknown> | null,
      correlationId: data.correlationId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      userId: data.userId,
      createdAt: data.createdAt,
    };
  }

  async create(data: CreateAuditLogData): Promise<AuditLogEntry> {
    const auditLog = await this.prisma.auditLog.create({
      data: {
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        previousState: (data.previousState as object) ?? undefined,
        newState: (data.newState as object) ?? undefined,
        metadata: (data.metadata as object) ?? undefined,
        correlationId: data.correlationId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        userId: data.userId,
      },
    });
    return this.toDomain(auditLog);
  }

  async findByEntityId(
    entityType: string,
    entityId: string,
  ): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { entityType, entityId },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => this.toDomain(log));
  }

  async findByCorrelationId(correlationId: string): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { correlationId },
      orderBy: { createdAt: 'asc' },
    });
    return logs.map((log) => this.toDomain(log));
  }

  async findByAction(action: AuditAction): Promise<AuditLogEntry[]> {
    const logs = await this.prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
    });
    return logs.map((log) => this.toDomain(log));
  }
}
