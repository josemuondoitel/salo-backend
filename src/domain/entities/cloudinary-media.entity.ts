// Domain Entity - Cloudinary Media

export enum MediaType {
  RESTAURANT_PROFILE = 'RESTAURANT_PROFILE',
  DISH_PHOTO = 'DISH_PHOTO',
  USER_PROFILE = 'USER_PROFILE',
}

export interface CloudinaryMediaProps {
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
  idempotencyKey: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CloudinaryMedia {
  private readonly props: CloudinaryMediaProps;

  constructor(props: CloudinaryMediaProps) {
    this.props = props;
  }

  get id(): string {
    return this.props.id;
  }

  get publicId(): string {
    return this.props.publicId;
  }

  get secureUrl(): string {
    return this.props.secureUrl;
  }

  get mediaType(): MediaType {
    return this.props.mediaType;
  }

  get entityType(): string {
    return this.props.entityType;
  }

  get entityId(): string {
    return this.props.entityId;
  }

  get width(): number | null | undefined {
    return this.props.width;
  }

  get height(): number | null | undefined {
    return this.props.height;
  }

  get format(): string | null | undefined {
    return this.props.format;
  }

  get bytes(): number | null | undefined {
    return this.props.bytes;
  }

  get idempotencyKey(): string {
    return this.props.idempotencyKey;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toJSON(): CloudinaryMediaProps {
    return { ...this.props };
  }
}
