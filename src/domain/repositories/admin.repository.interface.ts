// Domain Repository Interface - Admin
import { Admin } from '../entities/admin.entity';

export interface CreateAdminData {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
}

export interface IAdminRepository {
  findById(id: string): Promise<Admin | null>;
  findByEmail(email: string): Promise<Admin | null>;
  create(data: CreateAdminData): Promise<Admin>;
  update(
    id: string,
    data: Partial<{ firstName: string; lastName: string; isActive: boolean }>,
  ): Promise<Admin>;
}

export const ADMIN_REPOSITORY = Symbol('ADMIN_REPOSITORY');
