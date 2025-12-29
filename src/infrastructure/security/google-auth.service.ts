// Google Token Verification Service
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GoogleTokenPayload {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture?: string;
  iss: string;
  aud: string;
  exp: number;
  iat: number;
}

@Injectable()
export class GoogleAuthService {
  private readonly googleClientId: string;

  constructor(private readonly configService: ConfigService) {
    this.googleClientId = this.configService.get<string>(
      'GOOGLE_CLIENT_ID',
      '',
    );
  }

  /**
   * Verify Google ID token
   * In production, this would use Google's token verification endpoint
   * or the google-auth-library package
   */
  async verifyToken(idToken: string): Promise<GoogleTokenPayload> {
    if (!this.googleClientId) {
      throw new UnauthorizedException('Google OAuth not configured');
    }

    try {
      // Verify token using Google's tokeninfo endpoint
      const response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`,
      );

      if (!response.ok) {
        throw new UnauthorizedException('Invalid Google token');
      }

      const payload = (await response.json()) as GoogleTokenPayload;

      // Verify audience matches our client ID
      if (payload.aud !== this.googleClientId) {
        throw new UnauthorizedException(
          'Token was not issued for this application',
        );
      }

      // Verify email is verified
      if (!payload.email_verified) {
        throw new UnauthorizedException('Email not verified with Google');
      }

      // Verify token is not expired
      const now = Math.floor(Date.now() / 1000);
      if (payload.exp < now) {
        throw new UnauthorizedException('Token has expired');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Failed to verify Google token');
    }
  }

  /**
   * Check if Google OAuth is configured
   */
  isConfigured(): boolean {
    return !!this.googleClientId;
  }
}
