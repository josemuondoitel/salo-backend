// Cloudinary Media Entity Tests
import { CloudinaryMedia, MediaType } from './cloudinary-media.entity';

describe('CloudinaryMedia Entity', () => {
  describe('Media Creation', () => {
    it('should create restaurant profile media', () => {
      const media = new CloudinaryMedia({
        id: 'media-1',
        publicId: 'salo/restaurant/rest-1/profile',
        secureUrl:
          'https://res.cloudinary.com/demo/image/upload/v1234/salo/restaurant/rest-1/profile.jpg',
        mediaType: MediaType.RESTAURANT_PROFILE,
        entityType: 'restaurant',
        entityId: 'rest-1',
        width: 800,
        height: 600,
        format: 'jpg',
        bytes: 150000,
        idempotencyKey: 'idem-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(media.publicId).toBe('salo/restaurant/rest-1/profile');
      expect(media.mediaType).toBe(MediaType.RESTAURANT_PROFILE);
      expect(media.entityType).toBe('restaurant');
      expect(media.entityId).toBe('rest-1');
    });

    it('should create dish photo media', () => {
      const media = new CloudinaryMedia({
        id: 'media-2',
        publicId: 'salo/dish/dish-1/photo',
        secureUrl:
          'https://res.cloudinary.com/demo/image/upload/v1234/salo/dish/dish-1/photo.jpg',
        mediaType: MediaType.DISH_PHOTO,
        entityType: 'dish',
        entityId: 'dish-1',
        idempotencyKey: 'idem-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(media.mediaType).toBe(MediaType.DISH_PHOTO);
    });

    it('should create user profile media', () => {
      const media = new CloudinaryMedia({
        id: 'media-3',
        publicId: 'salo/user/user-1/profile',
        secureUrl:
          'https://res.cloudinary.com/demo/image/upload/v1234/salo/user/user-1/profile.jpg',
        mediaType: MediaType.USER_PROFILE,
        entityType: 'user',
        entityId: 'user-1',
        idempotencyKey: 'idem-3',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(media.mediaType).toBe(MediaType.USER_PROFILE);
    });
  });

  describe('Metadata Storage', () => {
    it('should store only public_id and secure URL (no binary)', () => {
      const media = new CloudinaryMedia({
        id: 'media-1',
        publicId: 'salo/restaurant/rest-1/profile',
        secureUrl:
          'https://res.cloudinary.com/demo/image/upload/v1234/salo/restaurant/rest-1/profile.jpg',
        mediaType: MediaType.RESTAURANT_PROFILE,
        entityType: 'restaurant',
        entityId: 'rest-1',
        idempotencyKey: 'idem-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const json = media.toJSON();

      // Should have public_id and secureUrl
      expect(json.publicId).toBeDefined();
      expect(json.secureUrl).toBeDefined();

      // Should NOT have binary data
      expect(json).not.toHaveProperty('data');
      expect(json).not.toHaveProperty('binary');
      expect(json).not.toHaveProperty('buffer');
    });
  });

  describe('Idempotency', () => {
    it('should have idempotency key for upload deduplication', () => {
      const media = new CloudinaryMedia({
        id: 'media-1',
        publicId: 'salo/restaurant/rest-1/profile',
        secureUrl:
          'https://res.cloudinary.com/demo/image/upload/v1234/salo/restaurant/rest-1/profile.jpg',
        mediaType: MediaType.RESTAURANT_PROFILE,
        entityType: 'restaurant',
        entityId: 'rest-1',
        idempotencyKey: 'upload-unique-key-12345',
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      expect(media.idempotencyKey).toBe('upload-unique-key-12345');
    });
  });
});
