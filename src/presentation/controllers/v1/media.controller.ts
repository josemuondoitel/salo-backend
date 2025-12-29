// Media Controller - API v1
import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import {
  MediaUseCase,
  SignedUploadParamsResponseDto,
  MediaResponseDto,
} from '../../../application/use-cases/media/media.use-case';
import { CurrentUser } from '../../decorators/current-user.decorator';
import { IdempotencyKey } from '../../decorators/idempotency-key.decorator';
import { JwtPayload } from '../../../infrastructure/security/jwt.strategy';
import { IsEnum, IsString, IsOptional, IsNumber, IsUrl } from 'class-validator';
import { MediaType } from '../../../domain/entities/cloudinary-media.entity';

class GetSignedUploadParamsRequestDto {
  @IsEnum(['restaurant', 'dish', 'user'])
  entityType!: 'restaurant' | 'dish' | 'user';

  @IsString()
  entityId!: string;
}

class StoreMediaMetadataRequestDto {
  @IsString()
  publicId!: string;

  @IsUrl()
  secureUrl!: string;

  @IsEnum(MediaType)
  mediaType!: MediaType;

  @IsString()
  entityType!: string;

  @IsString()
  entityId!: string;

  @IsOptional()
  @IsNumber()
  width?: number;

  @IsOptional()
  @IsNumber()
  height?: number;

  @IsOptional()
  @IsString()
  format?: string;

  @IsOptional()
  @IsNumber()
  bytes?: number;
}

@Controller('api/v1/media')
export class MediaController {
  constructor(private readonly mediaUseCase: MediaUseCase) {}

  /**
   * Get signed upload parameters for frontend direct upload to Cloudinary
   * Backend generates signed params, frontend uploads directly
   */
  @Post('signed-upload-params')
  async getSignedUploadParams(
    @Body() dto: GetSignedUploadParamsRequestDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<SignedUploadParamsResponseDto> {
    return this.mediaUseCase.getSignedUploadParams(dto, user.sub);
  }

  /**
   * Store media metadata after frontend uploads to Cloudinary
   * This is idempotent to handle retries
   */
  @Post('metadata')
  async storeMediaMetadata(
    @Body() dto: StoreMediaMetadataRequestDto,
    @CurrentUser() user: JwtPayload,
    @IdempotencyKey() idempotencyKey: string,
  ): Promise<MediaResponseDto> {
    return this.mediaUseCase.storeMediaMetadata(dto, user.sub, idempotencyKey);
  }

  /**
   * Get media for an entity
   */
  @Get()
  async getMediaByEntity(
    @Query('entityType') entityType: string,
    @Query('entityId') entityId: string,
  ): Promise<MediaResponseDto[]> {
    return this.mediaUseCase.getMediaByEntity(entityType, entityId);
  }
}
