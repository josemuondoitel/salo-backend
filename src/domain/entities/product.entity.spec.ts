// Product Entity Tests
import { Product, ProductStatus } from './product.entity';

describe('Product Entity', () => {
  const createProduct = (
    overrides: Partial<{
      id: string;
      name: string;
      description: string | null;
      price: number;
      quantity: number;
      status: ProductStatus;
      imageId: string | null;
      imageUrl: string | null;
      isFeatured: boolean;
      sortOrder: number;
      metadata: Record<string, unknown> | null;
      deletedAt: Date | null;
      restaurantId: string;
      createdAt: Date;
      updatedAt: Date;
    }> = {},
  ): Product => {
    return new Product({
      id: 'product-1',
      name: 'Test Product',
      description: 'A test product',
      price: 10.99,
      quantity: 100,
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
      ...overrides,
    });
  };

  describe('Basic Properties', () => {
    it('should create a product with all properties', () => {
      const product = createProduct();

      expect(product.id).toBe('product-1');
      expect(product.name).toBe('Test Product');
      expect(product.description).toBe('A test product');
      expect(product.price).toBe(10.99);
      expect(product.quantity).toBe(100);
      expect(product.status).toBe(ProductStatus.ACTIVE);
      expect(product.restaurantId).toBe('restaurant-1');
    });

    it('should return correct JSON representation', () => {
      const product = createProduct();
      const json = product.toJSON();

      expect(json.id).toBe('product-1');
      expect(json.name).toBe('Test Product');
      expect(json.status).toBe(ProductStatus.ACTIVE);
    });
  });

  describe('Status Checks', () => {
    it('should identify active product', () => {
      const product = createProduct({ status: ProductStatus.ACTIVE });

      expect(product.isActive()).toBe(true);
      expect(product.isInactive()).toBe(false);
      expect(product.isOutOfStock()).toBe(false);
    });

    it('should identify inactive product', () => {
      const product = createProduct({ status: ProductStatus.INACTIVE });

      expect(product.isActive()).toBe(false);
      expect(product.isInactive()).toBe(true);
      expect(product.isOutOfStock()).toBe(false);
    });

    it('should identify out of stock product', () => {
      const product = createProduct({ status: ProductStatus.OUT_OF_STOCK });

      expect(product.isActive()).toBe(false);
      expect(product.isInactive()).toBe(false);
      expect(product.isOutOfStock()).toBe(true);
    });
  });

  describe('Visibility Rules', () => {
    it('should be visible when ACTIVE and not deleted', () => {
      const product = createProduct({
        status: ProductStatus.ACTIVE,
        deletedAt: null,
      });

      expect(product.isVisible).toBe(true);
    });

    it('should NOT be visible when INACTIVE', () => {
      const product = createProduct({
        status: ProductStatus.INACTIVE,
        deletedAt: null,
      });

      expect(product.isVisible).toBe(false);
    });

    it('should NOT be visible when OUT_OF_STOCK', () => {
      const product = createProduct({
        status: ProductStatus.OUT_OF_STOCK,
        deletedAt: null,
      });

      expect(product.isVisible).toBe(false);
    });

    it('should NOT be visible when soft deleted', () => {
      const product = createProduct({
        status: ProductStatus.ACTIVE,
        deletedAt: new Date(),
      });

      expect(product.isVisible).toBe(false);
    });
  });

  describe('Soft Delete', () => {
    it('should identify deleted products', () => {
      const product = createProduct({ deletedAt: new Date() });

      expect(product.isDeleted()).toBe(true);
    });

    it('should identify non-deleted products', () => {
      const product = createProduct({ deletedAt: null });

      expect(product.isDeleted()).toBe(false);
    });

    it('should soft delete a product', () => {
      const product = createProduct({ deletedAt: null });
      const deleted = product.softDelete();

      expect(deleted.isDeleted()).toBe(true);
      expect(deleted.deletedAt).not.toBeNull();
    });

    it('should restore a soft deleted product', () => {
      const product = createProduct({ deletedAt: new Date() });
      const restored = product.restore();

      expect(restored.isDeleted()).toBe(false);
      expect(restored.deletedAt).toBeNull();
    });
  });

  describe('Status Transitions', () => {
    it('should activate an inactive product', () => {
      const product = createProduct({ status: ProductStatus.INACTIVE });
      const activated = product.activate();

      expect(activated.status).toBe(ProductStatus.ACTIVE);
    });

    it('should deactivate an active product', () => {
      const product = createProduct({ status: ProductStatus.ACTIVE });
      const deactivated = product.deactivate();

      expect(deactivated.status).toBe(ProductStatus.INACTIVE);
    });

    it('should mark product as out of stock', () => {
      const product = createProduct({ status: ProductStatus.ACTIVE });
      const outOfStock = product.markOutOfStock();

      expect(outOfStock.status).toBe(ProductStatus.OUT_OF_STOCK);
    });
  });

  describe('Quantity Management', () => {
    it('should update quantity', () => {
      const product = createProduct({ quantity: 100 });
      const updated = product.updateQuantity(50);

      expect(updated.quantity).toBe(50);
    });

    it('should throw error for negative quantity', () => {
      const product = createProduct({ quantity: 100 });

      expect(() => product.updateQuantity(-10)).toThrow(
        'Quantity cannot be negative',
      );
    });
  });

  describe('Ordering Rules', () => {
    it('should allow ordering when active and has quantity', () => {
      const product = createProduct({
        status: ProductStatus.ACTIVE,
        quantity: 10,
      });

      expect(product.canBeOrdered()).toBe(true);
    });

    it('should NOT allow ordering when inactive', () => {
      const product = createProduct({
        status: ProductStatus.INACTIVE,
        quantity: 10,
      });

      expect(product.canBeOrdered()).toBe(false);
    });

    it('should NOT allow ordering when quantity is zero', () => {
      const product = createProduct({
        status: ProductStatus.ACTIVE,
        quantity: 0,
      });

      expect(product.canBeOrdered()).toBe(false);
    });

    it('should NOT allow ordering when deleted', () => {
      const product = createProduct({
        status: ProductStatus.ACTIVE,
        quantity: 10,
        deletedAt: new Date(),
      });

      expect(product.canBeOrdered()).toBe(false);
    });
  });

  describe('Image Management', () => {
    it('should update image', () => {
      const product = createProduct();
      const updated = product.updateImage(
        'new-image-id',
        'https://cdn.example.com/new-image.jpg',
      );

      expect(updated.imageId).toBe('new-image-id');
      expect(updated.imageUrl).toBe('https://cdn.example.com/new-image.jpg');
    });

    it('should clear image', () => {
      const product = createProduct({
        imageId: 'old-image',
        imageUrl: 'https://cdn.example.com/old.jpg',
      });
      const updated = product.updateImage(null, null);

      expect(updated.imageId).toBeNull();
      expect(updated.imageUrl).toBeNull();
    });
  });

  describe('Featured Status', () => {
    it('should set product as featured', () => {
      const product = createProduct({ isFeatured: false });
      const featured = product.setFeatured(true);

      expect(featured.isFeatured).toBe(true);
    });

    it('should unset featured status', () => {
      const product = createProduct({ isFeatured: true });
      const unfeatured = product.setFeatured(false);

      expect(unfeatured.isFeatured).toBe(false);
    });
  });
});
