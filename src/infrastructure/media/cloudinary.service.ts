// Cloudinary Service - Generate signed upload parameters
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

export interface CloudinarySignedParams {
  timestamp: number;
  signature: string;
  apiKey: string;
  cloudName: string;
  folder: string;
}

export interface CloudinaryUploadResult {
  publicId: string;
  secureUrl: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
}

@Injectable()
export class CloudinaryService {
  private readonly cloudName: string;
  private readonly apiKey: string;
  private readonly apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.cloudName = this.configService.get<string>(
      'CLOUDINARY_CLOUD_NAME',
      '',
    );
    this.apiKey = this.configService.get<string>('CLOUDINARY_API_KEY', '');
    this.apiSecret = this.configService.get<string>(
      'CLOUDINARY_API_SECRET',
      '',
    );
  }

  /**
   * Generate signed upload parameters for frontend direct upload
   * Frontend uses these to upload directly to Cloudinary
   * Backend never handles binary files
   */
  generateSignedUploadParams(folder: string): CloudinarySignedParams {
    const timestamp = Math.round(Date.now() / 1000);

    // Create signature string
    const signatureString = `folder=${folder}&timestamp=${timestamp}${this.apiSecret}`;

    // Generate SHA-256 signature
    const signature = crypto
      .createHash('sha256')
      .update(signatureString)
      .digest('hex');

    return {
      timestamp,
      signature,
      apiKey: this.apiKey,
      cloudName: this.cloudName,
      folder,
    };
  }

  /**
   * Generate folder path based on entity type
   */
  getFolderPath(entityType: string, entityId: string): string {
    return `salo/${entityType}/${entityId}`;
  }

  /**
   * Check if Cloudinary is properly configured
   */
  isConfigured(): boolean {
    return !!(this.cloudName && this.apiKey && this.apiSecret);
  }
}
