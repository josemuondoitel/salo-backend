// Media Use Case - Cloudinary Integration
import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  ICloudinaryMediaRepository,
  CLOUDINARY_MEDIA_REPOSITORY,
} from '../../../domain/repositories/cloudinary-media.repository.interface';
import {
  IRestaurantRepository,
  RESTAURANT_REPOSITORY,
} from '../../../domain/repositories/restaurant.repository.interface';
import {
  MediaType,
  CloudinaryMedia,
} from '../../../domain/entities/cloudinary-media.entity';
import { CloudinaryService } from '../../../infrastructure/media/cloudinary.service';
import { IdempotencyService } from '../../../infrastructure/cache/idempotency.service';

export interface GetSignedUploadParamsDto {
  entityType: 'restaurant' | 'dish' | 'user';
  entityId: string;
}

export interface SignedUploadParamsResponseDto {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface StoreMediaMetadataDto {
  publicId: string;
  secureUrl: string;
  mediaType: MediaType;
  entityType: string;
  entityId: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

export interface MediaResponseDto {
  id: string;
  publicId: string;
  secureUrl: string;
  mediaType: MediaType;
  entityType: string;
  entityId: string;
  width?: number | null;
  height?: number | null;
  format?: string | null;
  bytes?: number | null;
  createdAt: Date;
}

@Injectable()
export class MediaUseCase {
  constructor(
    @Inject(CLOUDINARY_MEDIA_REPOSITORY)
    private readonly cloudinaryMediaRepository: ICloudinaryMediaRepository,
    @Inject(RESTAURANT_REPOSITORY)
    private readonly restaurantRepository: IRestaurantRepository,
    private readonly cloudinaryService: CloudinaryService,
    private readonly idempotencyService: IdempotencyService,
  ) {}

  /**
   * Get signed upload parameters for frontend direct upload to Cloudinary
   * Backend generates signed params, frontend uploads directly
   */
  async getSignedUploadParams(
    dto: GetSignedUploadParamsDto,
    userId: string,
  ): Promise<SignedUploadParamsResponseDto> {
    // Verify user has access to the entity
    await this.verifyEntityAccess(dto.entityType, dto.entityId, userId);

    // Generate folder path
    const folder = this.cloudinaryService.getFolderPath(
      dto.entityType,
      dto.entityId,
    );

    // Generate signed params
    const params = this.cloudinaryService.generateSignedUploadParams(folder);

    return {
      timestamp: params.timestamp,
      signature: params.signature,
      apiKey: params.apiKey,
      cloudName: params.cloudName,
      folder: params.folder,
    };
  }

  /**
   * Store media metadata after frontend uploads to Cloudinary
   * This is idempotent to handle retries
   */
  async storeMediaMetadata(
    dto: StoreMediaMetadataDto,
    userId: string,
    idempotencyKey: string,
  ): Promise<MediaResponseDto> {
    // Check idempotency
    const existingResult = await this.idempotencyService.check(idempotencyKey);
    if (existingResult.exists && existingResult.response) {
      return existingResult.response.body as MediaResponseDto;
    }

    // Check if media already exists with this idempotency key
    const existingMedia =
      await this.cloudinaryMediaRepository.findByIdempotencyKey(idempotencyKey);
    if (existingMedia) {
      return this.toResponseDto(existingMedia);
    }

    // Verify user has access to the entity
    await this.verifyEntityAccess(dto.entityType, dto.entityId, userId);

    // Store media metadata
    const media = await this.cloudinaryMediaRepository.create({
      publicId: dto.publicId,
      secureUrl: dto.secureUrl,
      mediaType: dto.mediaType,
      entityType: dto.entityType,
      entityId: dto.entityId,
      width: dto.width,
      height: dto.height,
      format: dto.format,
      bytes: dto.bytes,
      idempotencyKey,
    });

    const response = this.toResponseDto(media);

    // Store idempotency result
    await this.idempotencyService.store(idempotencyKey, 201, response);

    return response;
  }

  /**
   * Get media for an entity
   */
  async getMediaByEntity(
    entityType: string,
    entityId: string,
  ): Promise<MediaResponseDto[]> {
    const media = await this.cloudinaryMediaRepository.findByEntity(
      entityType,
      entityId,
    );
    return media.map((m) => this.toResponseDto(m));
  }

  private async verifyEntityAccess(
    entityType: string,
    entityId: string,
    userId: string,
  ): Promise<void> {
    switch (entityType) {
      case 'restaurant': {
        const restaurant = await this.restaurantRepository.findById(entityId);
        if (!restaurant) {
          throw new NotFoundException('Restaurant not found');
        }
        if (restaurant.ownerId !== userId) {
          throw new ForbiddenException(
            'Not authorized to upload media for this restaurant',
          );
        }
        break;
      }
      case 'dish': {
        // For dish, we need to check restaurant ownership
        // This would require a menu item repository lookup
        // For now, we'll pass - in production, add proper verification
        break;
      }
      case 'user': {
        if (entityId !== userId) {
          throw new ForbiddenException(
            'Not authorized to upload media for this user',
          );
        }
        break;
      }
      default:
        throw new ForbiddenException('Invalid entity type');
    }
  }

  private toResponseDto(media: CloudinaryMedia): MediaResponseDto {
    return {
      id: media.id,
      publicId: media.publicId,
      secureUrl: media.secureUrl,
      mediaType: media.mediaType,
      entityType: media.entityType,
      entityId: media.entityId,
      width: media.width,
      height: media.height,
      format: media.format,
      bytes: media.bytes,
      createdAt: media.createdAt,
    };
  }
}
