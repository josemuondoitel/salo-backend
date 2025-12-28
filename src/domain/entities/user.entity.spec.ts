// User Entity Tests - Google OAuth Support
import { User, UserRole } from './user.entity';

describe('User Entity - Google OAuth', () => {
  describe('Local User', () => {
    it('should create a local user with password', () => {
      const user = new User({
        id: 'user-1',
        email: 'user@example.com',
        passwordHash: 'hashed_password',
        role: UserRole.CUSTOMER,
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567890',
        authProvider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.email).toBe('user@example.com');
      expect(user.passwordHash).toBe('hashed_password');
      expect(user.authProvider).toBe('local');
      expect(user.isGoogleUser()).toBe(false);
    });
  });

  describe('Google User', () => {
    it('should create a Google OAuth user', () => {
      const user = new User({
        id: 'user-2',
        email: 'user@gmail.com',
        passwordHash: null,
        role: UserRole.CUSTOMER,
        firstName: 'Jane',
        lastName: 'Doe',
        googleId: 'google-123456',
        authProvider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.email).toBe('user@gmail.com');
      expect(user.passwordHash).toBeNull();
      expect(user.googleId).toBe('google-123456');
      expect(user.authProvider).toBe('google');
      expect(user.isGoogleUser()).toBe(true);
    });

    it('should have no password for Google-only users', () => {
      const user = new User({
        id: 'user-2',
        email: 'user@gmail.com',
        role: UserRole.CUSTOMER,
        firstName: 'Jane',
        lastName: 'Doe',
        googleId: 'google-123456',
        authProvider: 'google',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      // Google users should not have password
      expect(user.passwordHash).toBeUndefined();
    });
  });

  describe('Role Checks', () => {
    it('should identify customer role', () => {
      const user = new User({
        id: 'user-1',
        email: 'customer@example.com',
        passwordHash: 'hash',
        role: UserRole.CUSTOMER,
        firstName: 'Customer',
        lastName: 'User',
        authProvider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.isCustomer()).toBe(true);
      expect(user.isRestaurantOwner()).toBe(false);
      expect(user.isAdmin()).toBe(false);
    });

    it('should identify restaurant owner role', () => {
      const user = new User({
        id: 'user-1',
        email: 'owner@example.com',
        passwordHash: 'hash',
        role: UserRole.RESTAURANT_OWNER,
        firstName: 'Owner',
        lastName: 'User',
        authProvider: 'local',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(user.isCustomer()).toBe(false);
      expect(user.isRestaurantOwner()).toBe(true);
      expect(user.isAdmin()).toBe(false);
    });
  });
});
