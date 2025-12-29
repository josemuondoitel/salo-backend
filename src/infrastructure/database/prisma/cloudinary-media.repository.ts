// Cloudinary Media Repository - Prisma Implementation
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  ICloudinaryMediaRepository,
  CreateCloudinaryMediaData,
} from '../../../domain/repositories/cloudinary-media.repository.interface';
import {
  CloudinaryMedia,
  MediaType,
} from '../../../domain/entities/cloudinary-media.entity';

@Injectable()
export class PrismaCloudinaryMediaRepository implements ICloudinaryMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(data: {
    id: string;
    publicId: string;
    secureUrl: string;
    mediaType: string;
    entityType: string;
    entityId: string;
    width: number | null;
    height: number | null;
    format: string | null;
    bytes: number | null;
    idempotencyKey: string;
    createdAt: Date;
    updatedAt: Date;
  }): CloudinaryMedia {
    return new CloudinaryMedia({
      id: data.id,
      publicId: data.publicId,
      secureUrl: data.secureUrl,
      mediaType: data.mediaType as MediaType,
      entityType: data.entityType,
      entityId: data.entityId,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      idempotencyKey: data.idempotencyKey,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  async findById(id: string): Promise<CloudinaryMedia | null> {
    const media = await this.prisma.cloudinaryMedia.findUnique({
      where: { id },
    });
    return media ? this.toDomain(media) : null;
  }

  async findByPublicId(publicId: string): Promise<CloudinaryMedia | null> {
    const media = await this.prisma.cloudinaryMedia.findUnique({
      where: { publicId },
    });
    return media ? this.toDomain(media) : null;
  }

  async findByIdempotencyKey(
    idempotencyKey: string,
  ): Promise<CloudinaryMedia | null> {
    const media = await this.prisma.cloudinaryMedia.findUnique({
      where: { idempotencyKey },
    });
    return media ? this.toDomain(media) : null;
  }

  async findByEntity(
    entityType: string,
    entityId: string,
  ): Promise<CloudinaryMedia[]> {
    const media = await this.prisma.cloudinaryMedia.findMany({
      where: { entityType, entityId },
    });
    return media.map((m) => this.toDomain(m));
  }

  async create(data: CreateCloudinaryMediaData): Promise<CloudinaryMedia> {
    const media = await this.prisma.cloudinaryMedia.create({
      data: {
        publicId: data.publicId,
        secureUrl: data.secureUrl,
        mediaType: data.mediaType,
        entityType: data.entityType,
        entityId: data.entityId,
        width: data.width ?? null,
        height: data.height ?? null,
        format: data.format ?? null,
        bytes: data.bytes ?? null,
        idempotencyKey: data.idempotencyKey,
      },
    });
    return this.toDomain(media);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cloudinaryMedia.delete({ where: { id } });
  }
}
