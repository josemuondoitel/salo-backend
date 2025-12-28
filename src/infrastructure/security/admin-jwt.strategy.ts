// Admin JWT Strategy - Separate from User JWT
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface AdminJwtPayload {
  sub: string;
  email: string;
  isAdmin: true;
  iss?: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('ADMIN_JWT_SECRET');
    const issuer = configService.get<string>('ADMIN_JWT_ISSUER', 'salo-admin');

    if (!secret) {
      throw new Error('ADMIN_JWT_SECRET must be defined');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
      issuer,
    });
  }

  validate(payload: AdminJwtPayload): AdminJwtPayload {
    if (!payload.sub || !payload.email || payload.isAdmin !== true) {
      throw new UnauthorizedException('Invalid admin token payload');
    }
    return payload;
  }
}
