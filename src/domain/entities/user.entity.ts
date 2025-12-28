// Domain Entities - Pure business logic, framework-agnostic

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  ADMIN = 'ADMIN',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User {
  private readonly props: UserProps;

  constructor(props: UserProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get passwordHash(): string {
    return this.props.passwordHash;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get firstName(): string {
    return this.props.firstName;
  }

  get lastName(): string {
    return this.props.lastName;
  }

  get phone(): string | null | undefined {
    return this.props.phone;
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  isAdmin(): boolean {
    return this.props.role === UserRole.ADMIN;
  }

  isRestaurantOwner(): boolean {
    return this.props.role === UserRole.RESTAURANT_OWNER;
  }

  isCustomer(): boolean {
    return this.props.role === UserRole.CUSTOMER;
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
