// E2E Tests - Restaurant Product Management
// Tests verify product lifecycle and visibility rules

import { Product, ProductStatus } from '../src/domain/entities/product.entity';
import {
  Restaurant,
  RestaurantStatus,
} from '../src/domain/entities/restaurant.entity';
import {
  Subscription,
  SubscriptionStatus,
} from '../src/domain/entities/subscription.entity';

describe('Restaurant Product Management (Integration)', () => {
  const createRestaurant = (
    status: RestaurantStatus = RestaurantStatus.ACTIVE,
  ) =>
    new Restaurant({
      id: 'restaurant-1',
      name: 'Test Restaurant',
      description: 'A test restaurant',
      address: '123 Test St',
      phone: '1234567890',
      status,
      ownerId: 'owner-1',
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const createProduct = (
    status: ProductStatus = ProductStatus.ACTIVE,
    deletedAt: Date | null = null,
  ) =>
    new Product({
      id: 'product-1',
      name: 'Test Product',
      description: 'A test product',
      price: 10.99,
      quantity: 100,
      status,
      imageId: null,
      imageUrl: null,
      isFeatured: false,
      sortOrder: 0,
      metadata: null,
      deletedAt,
      restaurantId: 'restaurant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

  const createValidSubscription = () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    return new Subscription({
      id: 'sub-1',
      status: SubscriptionStatus.ACTIVE,
      startDate: new Date(),
      endDate: futureDate,
      monthlyAmount: 5000,
      restaurantId: 'restaurant-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  };

  describe('Product Creation', () => {
    it('should create a product with default values', () => {
      const product = createProduct();

      expect(product.id).toBe('product-1');
      expect(product.name).toBe('Test Product');
      expect(product.status).toBe(ProductStatus.ACTIVE);
      expect(product.isFeatured).toBe(false);
      expect(product.sortOrder).toBe(0);
    });

    it('should create a product with all required fields', () => {
      const product = new Product({
        id: 'product-2',
        name: 'Premium Burger',
        description: 'Delicious burger',
        price: 15.99,
        quantity: 50,
        status: ProductStatus.ACTIVE,
        imageId: 'img-123',
        imageUrl: 'https://cdn.example.com/burger.jpg',
        isFeatured: true,
        sortOrder: 1,
        metadata: { category: 'main', tags: ['beef', 'popular'] },
        deletedAt: null,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(product.name).toBe('Premium Burger');
      expect(product.price).toBe(15.99);
      expect(product.isFeatured).toBe(true);
      expect(product.metadata).toEqual({
        category: 'main',
        tags: ['beef', 'popular'],
      });
    });
  });

  describe('Product Status Management', () => {
    it('should activate an inactive product', () => {
      const product = createProduct(ProductStatus.INACTIVE);
      const activated = product.activate();

      expect(activated.status).toBe(ProductStatus.ACTIVE);
      expect(activated.isActive()).toBe(true);
    });

    it('should deactivate an active product', () => {
      const product = createProduct(ProductStatus.ACTIVE);
      const deactivated = product.deactivate();

      expect(deactivated.status).toBe(ProductStatus.INACTIVE);
      expect(deactivated.isInactive()).toBe(true);
    });

    it('should mark product as out of stock', () => {
      const product = createProduct(ProductStatus.ACTIVE);
      const outOfStock = product.markOutOfStock();

      expect(outOfStock.status).toBe(ProductStatus.OUT_OF_STOCK);
      expect(outOfStock.isOutOfStock()).toBe(true);
    });
  });

  describe('Soft Delete', () => {
    it('should soft delete a product', () => {
      const product = createProduct();
      expect(product.isDeleted()).toBe(false);

      const deleted = product.softDelete();
      expect(deleted.isDeleted()).toBe(true);
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('should restore a soft deleted product', () => {
      const product = createProduct(ProductStatus.ACTIVE, new Date());
      expect(product.isDeleted()).toBe(true);

      const restored = product.restore();
      expect(restored.isDeleted()).toBe(false);
      expect(restored.deletedAt).toBeNull();
    });

    it('should exclude soft deleted products from visibility', () => {
      const product = createProduct(ProductStatus.ACTIVE, new Date());

      expect(product.status).toBe(ProductStatus.ACTIVE);
      expect(product.isDeleted()).toBe(true);
      expect(product.isVisible).toBe(false);
    });
  });

  describe('Product Visibility Rules', () => {
    it('should be visible when ACTIVE and not deleted', () => {
      const product = createProduct(ProductStatus.ACTIVE, null);

      expect(product.isVisible).toBe(true);
    });

    it('should NOT be visible when INACTIVE', () => {
      const product = createProduct(ProductStatus.INACTIVE, null);

      expect(product.isVisible).toBe(false);
    });

    it('should NOT be visible when OUT_OF_STOCK', () => {
      const product = createProduct(ProductStatus.OUT_OF_STOCK, null);

      expect(product.isVisible).toBe(false);
    });

    it('should NOT be visible when soft deleted', () => {
      const product = createProduct(ProductStatus.ACTIVE, new Date());

      expect(product.isVisible).toBe(false);
    });
  });

  describe('Combined Visibility (Restaurant + Product)', () => {
    it('should be fully visible when restaurant is ACTIVE with valid subscription and product is ACTIVE', () => {
      const restaurant = createRestaurant(RestaurantStatus.ACTIVE);
      const subscription = createValidSubscription();
      const product = createProduct(ProductStatus.ACTIVE);

      expect(restaurant.isActive()).toBe(true);
      expect(subscription.isValid()).toBe(true);
      expect(product.isVisible).toBe(true);

      // Full visibility check
      const isFullyVisible =
        restaurant.isActive() && subscription.isValid() && product.isVisible;
      expect(isFullyVisible).toBe(true);
    });

    it('should NOT be visible when restaurant is SUSPENDED', () => {
      const restaurant = createRestaurant(RestaurantStatus.SUSPENDED);
      const subscription = createValidSubscription();
      const product = createProduct(ProductStatus.ACTIVE);

      expect(restaurant.isActive()).toBe(false);
      expect(subscription.isValid()).toBe(true);
      expect(product.isVisible).toBe(true);

      // Full visibility check
      const isFullyVisible =
        restaurant.isActive() && subscription.isValid() && product.isVisible;
      expect(isFullyVisible).toBe(false);
    });

    it('should NOT be visible when subscription is expired', () => {
      const restaurant = createRestaurant(RestaurantStatus.ACTIVE);
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 1);
      const subscription = new Subscription({
        id: 'sub-1',
        status: SubscriptionStatus.ACTIVE,
        startDate: new Date('2024-01-01'),
        endDate: pastDate,
        monthlyAmount: 5000,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const product = createProduct(ProductStatus.ACTIVE);

      expect(restaurant.isActive()).toBe(true);
      expect(subscription.isValid()).toBe(false);
      expect(product.isVisible).toBe(true);

      // Full visibility check
      const isFullyVisible =
        restaurant.isActive() && subscription.isValid() && product.isVisible;
      expect(isFullyVisible).toBe(false);
    });

    it('should NOT be visible when product is INACTIVE', () => {
      const restaurant = createRestaurant(RestaurantStatus.ACTIVE);
      const subscription = createValidSubscription();
      const product = createProduct(ProductStatus.INACTIVE);

      expect(restaurant.isActive()).toBe(true);
      expect(subscription.isValid()).toBe(true);
      expect(product.isVisible).toBe(false);

      // Full visibility check
      const isFullyVisible =
        restaurant.isActive() && subscription.isValid() && product.isVisible;
      expect(isFullyVisible).toBe(false);
    });
  });

  describe('Quantity Management', () => {
    it('should update quantity correctly', () => {
      const product = createProduct();
      const updated = product.updateQuantity(50);

      expect(updated.quantity).toBe(50);
    });

    it('should reject negative quantity', () => {
      const product = createProduct();

      expect(() => product.updateQuantity(-1)).toThrow(
        'Quantity cannot be negative',
      );
    });

    it('should allow zero quantity', () => {
      const product = createProduct();
      const updated = product.updateQuantity(0);

      expect(updated.quantity).toBe(0);
    });
  });

  describe('Ordering Rules', () => {
    it('should allow ordering active product with quantity', () => {
      const product = createProduct(ProductStatus.ACTIVE);

      expect(product.canBeOrdered()).toBe(true);
    });

    it('should NOT allow ordering inactive product', () => {
      const product = createProduct(ProductStatus.INACTIVE);

      expect(product.canBeOrdered()).toBe(false);
    });

    it('should NOT allow ordering deleted product', () => {
      const product = createProduct(ProductStatus.ACTIVE, new Date());

      expect(product.canBeOrdered()).toBe(false);
    });

    it('should NOT allow ordering product with zero quantity', () => {
      const product = new Product({
        id: 'product-1',
        name: 'Test Product',
        description: 'A test product',
        price: 10.99,
        quantity: 0,
        status: ProductStatus.ACTIVE,
        imageId: null,
        imageUrl: null,
        isFeatured: false,
        sortOrder: 0,
        metadata: null,
        deletedAt: null,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(product.canBeOrdered()).toBe(false);
    });
  });

  describe('Featured Products', () => {
    it('should set product as featured', () => {
      const product = createProduct();
      const featured = product.setFeatured(true);

      expect(featured.isFeatured).toBe(true);
    });

    it('should unset featured status', () => {
      const product = new Product({
        id: 'product-1',
        name: 'Test Product',
        description: 'A test product',
        price: 10.99,
        quantity: 100,
        status: ProductStatus.ACTIVE,
        imageId: null,
        imageUrl: null,
        isFeatured: true,
        sortOrder: 0,
        metadata: null,
        deletedAt: null,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const unfeatured = product.setFeatured(false);

      expect(unfeatured.isFeatured).toBe(false);
    });
  });

  describe('Image Management', () => {
    it('should update product image', () => {
      const product = createProduct();
      const updated = product.updateImage(
        'new-id',
        'https://cdn.example.com/new.jpg',
      );

      expect(updated.imageId).toBe('new-id');
      expect(updated.imageUrl).toBe('https://cdn.example.com/new.jpg');
    });

    it('should clear product image', () => {
      const product = new Product({
        id: 'product-1',
        name: 'Test Product',
        description: 'A test product',
        price: 10.99,
        quantity: 100,
        status: ProductStatus.ACTIVE,
        imageId: 'old-id',
        imageUrl: 'https://cdn.example.com/old.jpg',
        isFeatured: false,
        sortOrder: 0,
        metadata: null,
        deletedAt: null,
        restaurantId: 'restaurant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      const updated = product.updateImage(null, null);

      expect(updated.imageId).toBeNull();
      expect(updated.imageUrl).toBeNull();
    });
  });
});
