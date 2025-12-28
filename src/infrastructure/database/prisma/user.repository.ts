// User Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IUserRepository } from '../../../domain/repositories/user.repository.interface';
import { User, UserRole } from '../../../domain/entities/user.entity';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: string;
    email: string;
    passwordHash: string;
    role: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role as UserRole,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    return user ? this.toDomain(user) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    return user ? this.toDomain(user) : null;
  }

  async create(data: {
    passwordHash: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
  }): Promise<User> {
    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role as UserRole,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone ?? null,
      },
    });
    return this.toDomain(user);
  }

  async update(
    id: string,
    data: Partial<{ firstName: string; lastName: string; phone: string | null }>
  ): Promise<User> {
    const user = await this.prisma.user.update({
      where: { id },
      data,
    });
    return this.toDomain(user);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }
}
