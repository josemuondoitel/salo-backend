// Admin Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  IAdminRepository,
  CreateAdminData,
} from '../../../domain/repositories/admin.repository.interface';
import { Admin } from '../../../domain/entities/admin.entity';

@Injectable()
export class PrismaAdminRepository implements IAdminRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): Admin {
    return new Admin({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<Admin | null> {
    const admin = await this.prisma.admin.findUnique({ where: { id } });
    return admin ? this.toDomain(admin) : null;
  }

  async findByEmail(email: string): Promise<Admin | null> {
    const admin = await this.prisma.admin.findUnique({ where: { email } });
    return admin ? this.toDomain(admin) : null;
  }

  async create(data: CreateAdminData): Promise<Admin> {
    const admin = await this.prisma.admin.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });
    return this.toDomain(admin);
  }

  async update(
    id: string,
    data: Partial<{ firstName: string; lastName: string; isActive: boolean }>,
  ): Promise<Admin> {
    const admin = await this.prisma.admin.update({
      where: { id },
      data,
    });
    return this.toDomain(admin);
  }
}
