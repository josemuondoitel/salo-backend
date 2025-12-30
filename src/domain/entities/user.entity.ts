// Domain Entities - Pure business logic, framework-agnostic
// NOTE: ADMIN role removed - Admin access is via separate Admin table

export enum UserRole {
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
}

export interface UserProps {
  id: string;
  email: string;
  passwordHash?: string | null;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string | null;
  googleId?: string | null;
  authProvider: string;
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

  get passwordHash(): string | null | undefined {
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

  get googleId(): string | null | undefined {
    return this.props.googleId;
  }

  get authProvider(): string {
    return this.props.authProvider;
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

  // NOTE: isAdmin() removed - Admin access is via separate Admin table and AdminJwtStrategy

  isRestaurantOwner(): boolean {
    return this.props.role === UserRole.RESTAURANT_OWNER;
  }

  isCustomer(): boolean {
    return this.props.role === UserRole.CUSTOMER;
  }

  isGoogleUser(): boolean {
    return this.props.authProvider === 'google';
  }

  toJSON(): UserProps {
    return { ...this.props };
  }
}
