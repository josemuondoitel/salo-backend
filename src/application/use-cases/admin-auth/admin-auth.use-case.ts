// Admin Authentication Use Case - SEPARATE from User Auth
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  IAdminRepository,
  ADMIN_REPOSITORY,
} from '../../../domain/repositories/admin.repository.interface';

export interface AdminLoginDto {
  email: string;
  password: string;
}

export interface AdminAuthResponseDto {
  accessToken: string;
  expiresIn: string;
  admin: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class AdminAuthUseCase {
  private readonly ADMIN_JWT_SECRET: string;
  private readonly ADMIN_JWT_EXPIRATION: string;
  private readonly ADMIN_JWT_ISSUER: string;

  constructor(
    @Inject(ADMIN_REPOSITORY)
    private readonly adminRepository: IAdminRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.ADMIN_JWT_SECRET = this.configService.get<string>(
      'ADMIN_JWT_SECRET',
      '',
    );
    this.ADMIN_JWT_EXPIRATION = this.configService.get<string>(
      'ADMIN_JWT_EXPIRATION',
      '4h',
    );
    this.ADMIN_JWT_ISSUER = this.configService.get<string>(
      'ADMIN_JWT_ISSUER',
      'salo-admin',
    );
  }

  /**
   * Admin login - COMPLETELY SEPARATE from user login
   * Uses different JWT secret, issuer, and claims
   */
  async login(dto: AdminLoginDto): Promise<AdminAuthResponseDto> {
    // Find admin by email
    const admin = await this.adminRepository.findByEmail(dto.email);
    if (!admin) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Check if admin is active
    if (!admin.canLogin()) {
      throw new UnauthorizedException('Admin account is disabled');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      admin.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials');
    }

    // Generate admin-specific token with separate issuer
    const accessToken = this.generateAdminToken(admin.id, admin.email);

    return {
      accessToken,
      expiresIn: this.ADMIN_JWT_EXPIRATION,
      admin: {
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
    };
  }

  private generateAdminToken(adminId: string, email: string): string {
    const payload = {
      sub: adminId,
      email,
      isAdmin: true,
    };

    const expiresInSeconds = this.parseExpiresIn(this.ADMIN_JWT_EXPIRATION);

    return this.jwtService.sign(payload, {
      secret: this.ADMIN_JWT_SECRET,
      expiresIn: expiresInSeconds,
      issuer: this.ADMIN_JWT_ISSUER,
    });
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 14400; // Default 4h in seconds
    }
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 14400;
    }
  }
}
