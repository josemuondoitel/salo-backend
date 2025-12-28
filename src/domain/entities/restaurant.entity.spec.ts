// Unit Tests - Restaurant Entity
import { Restaurant, RestaurantStatus } from '../../domain/entities/restaurant.entity';

describe('Restaurant Entity', () => {
  const createRestaurant = (overrides: Partial<{
    id: string;
    name: string;
    description: string | null;
    address: string;
    phone: string;
    status: RestaurantStatus;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  }> = {}): Restaurant => {
    return new Restaurant({
      id: 'rest-123',
      name: 'Test Restaurant',
      description: 'A test restaurant',
      address: '123 Test St',
      phone: '123456789',
      status: RestaurantStatus.ACTIVE,
      ownerId: 'owner-123',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    });
  };

  describe('isVisible', () => {
    it('should return true when restaurant is ACTIVE', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.ACTIVE });
      expect(restaurant.isVisible).toBe(true);
    });

    it('should return false when restaurant is PENDING', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.PENDING });
      expect(restaurant.isVisible).toBe(false);
    });

    it('should return false when restaurant is SUSPENDED', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.SUSPENDED });
      expect(restaurant.isVisible).toBe(false);
    });

    it('should return false when restaurant is INACTIVE', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.INACTIVE });
      expect(restaurant.isVisible).toBe(false);
    });
  });

  describe('visibility', () => {
    it('should return 100 when restaurant is ACTIVE', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.ACTIVE });
      expect(restaurant.visibility).toBe(100);
    });

    it('should return 0 when restaurant is not ACTIVE', () => {
      const suspendedRestaurant = createRestaurant({ status: RestaurantStatus.SUSPENDED });
      expect(suspendedRestaurant.visibility).toBe(0);

      const pendingRestaurant = createRestaurant({ status: RestaurantStatus.PENDING });
      expect(pendingRestaurant.visibility).toBe(0);

      const inactiveRestaurant = createRestaurant({ status: RestaurantStatus.INACTIVE });
      expect(inactiveRestaurant.visibility).toBe(0);
    });
  });

  describe('canReceiveOrders', () => {
    it('should return true when restaurant is ACTIVE', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.ACTIVE });
      expect(restaurant.canReceiveOrders()).toBe(true);
    });

    it('should return false when restaurant is not ACTIVE', () => {
      const suspendedRestaurant = createRestaurant({ status: RestaurantStatus.SUSPENDED });
      expect(suspendedRestaurant.canReceiveOrders()).toBe(false);
    });
  });

  describe('suspend', () => {
    it('should return new restaurant with SUSPENDED status', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.ACTIVE });
      const suspended = restaurant.suspend();

      expect(suspended.status).toBe(RestaurantStatus.SUSPENDED);
      expect(suspended.isVisible).toBe(false);
      expect(suspended.visibility).toBe(0);
      expect(restaurant.status).toBe(RestaurantStatus.ACTIVE); // Original unchanged
    });
  });

  describe('activate', () => {
    it('should return new restaurant with ACTIVE status', () => {
      const restaurant = createRestaurant({ status: RestaurantStatus.SUSPENDED });
      const activated = restaurant.activate();

      expect(activated.status).toBe(RestaurantStatus.ACTIVE);
      expect(activated.isVisible).toBe(true);
      expect(activated.visibility).toBe(100);
      expect(restaurant.status).toBe(RestaurantStatus.SUSPENDED); // Original unchanged
    });
  });

  describe('Auto-Suspension on Expiration', () => {
    it('should demonstrate visibility becomes ZERO when suspended', () => {
      const activeRestaurant = createRestaurant({ status: RestaurantStatus.ACTIVE });
      
      // Before suspension
      expect(activeRestaurant.visibility).toBe(100);
      expect(activeRestaurant.isVisible).toBe(true);
      expect(activeRestaurant.canReceiveOrders()).toBe(true);

      // After suspension (simulating what happens when subscription expires)
      const suspendedRestaurant = activeRestaurant.suspend();
      
      // ZERO TOLERANCE: Visibility MUST be ZERO
      expect(suspendedRestaurant.visibility).toBe(0);
      expect(suspendedRestaurant.isVisible).toBe(false);
      expect(suspendedRestaurant.canReceiveOrders()).toBe(false);
    });
  });
});
