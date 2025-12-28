// Admin Entity Tests
import { Admin } from './admin.entity';

describe('Admin Entity', () => {
  describe('Admin Creation', () => {
    it('should create an admin with correct properties', () => {
      const admin = new Admin({
        id: 'admin-1',
        email: 'admin@salo.com',
        passwordHash: 'hashed_password',
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(admin.id).toBe('admin-1');
      expect(admin.email).toBe('admin@salo.com');
      expect(admin.firstName).toBe('System');
      expect(admin.lastName).toBe('Admin');
      expect(admin.fullName).toBe('System Admin');
      expect(admin.isActive).toBe(true);
    });

    it('should allow login when active', () => {
      const admin = new Admin({
        id: 'admin-1',
        email: 'admin@salo.com',
        passwordHash: 'hashed_password',
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(admin.canLogin()).toBe(true);
    });

    it('should NOT allow login when inactive', () => {
      const admin = new Admin({
        id: 'admin-1',
        email: 'admin@salo.com',
        passwordHash: 'hashed_password',
        firstName: 'System',
        lastName: 'Admin',
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(admin.canLogin()).toBe(false);
    });
  });

  describe('Admin vs User Separation', () => {
    it('should have separate table structure (Admin is not a User)', () => {
      // Admin entity has different properties than User
      // Admin does NOT have: role, phone, googleId, authProvider
      const admin = new Admin({
        id: 'admin-1',
        email: 'admin@salo.com',
        passwordHash: 'hashed_password',
        firstName: 'System',
        lastName: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const adminJson = admin.toJSON();

      // Admin specific properties
      expect(adminJson).toHaveProperty('isActive');

      // User properties that Admin should NOT have
      expect(adminJson).not.toHaveProperty('role');
      expect(adminJson).not.toHaveProperty('phone');
      expect(adminJson).not.toHaveProperty('googleId');
      expect(adminJson).not.toHaveProperty('authProvider');
    });
  });
});
