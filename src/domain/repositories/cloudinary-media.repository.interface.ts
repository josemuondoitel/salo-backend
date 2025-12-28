// Domain Repository Interface - Cloudinary Media
import {
  CloudinaryMedia,
  MediaType,
} from '../entities/cloudinary-media.entity';

export interface CreateCloudinaryMediaData {
  publicId: string;
  secureUrl: string;
  mediaType: MediaType;
  entityType: string;
  entityId: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  bytes?: number | null;
  idempotencyKey: string;
}

export interface ICloudinaryMediaRepository {
  findById(id: string): Promise<CloudinaryMedia | null>;
  findByPublicId(publicId: string): Promise<CloudinaryMedia | null>;
  findByIdempotencyKey(idempotencyKey: string): Promise<CloudinaryMedia | null>;
  findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<CloudinaryMedia[]>;
  create(data: CreateCloudinaryMediaData): Promise<CloudinaryMedia>;
  delete(id: string): Promise<void>;
}

export const CLOUDINARY_MEDIA_REPOSITORY = Symbol(
  'CLOUDINARY_MEDIA_REPOSITORY',
);
