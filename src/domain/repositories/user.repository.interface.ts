// Domain Repository Interface - User
import { User } from '../entities/user.entity';

export interface CreateUserData {
  passwordHash: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
}

export interface IUserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  create(data: CreateUserData): Promise<User>;
  update(id: string, data: Partial<{ firstName: string; lastName: string; phone: string | null }>): Promise<User>;
  delete(id: string): Promise<void>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
