// Authentication Use Cases
import {
  Injectable,
  Inject,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  IUserRepository,
  USER_REPOSITORY,
} from '../../../domain/repositories/user.repository.interface';
import {
  RegisterDto,
  LoginDto,
  AuthResponseDto,
  GoogleLoginDto,
} from '../../dtos/auth.dto';
import { UserRole } from '../../../domain/entities/user.entity';
import { GoogleAuthService } from '../../../infrastructure/security/google-auth.service';

@Injectable()
export class AuthUseCase {
  private readonly SALT_ROUNDS = 12;
  private readonly JWT_EXPIRATION: string;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly googleAuthService: GoogleAuthService,
  ) {
    this.JWT_EXPIRATION = this.configService.get<string>(
      'JWT_EXPIRATION',
      '1h',
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, this.SALT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      passwordHash,
      role: dto.role || UserRole.CUSTOMER,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      authProvider: 'local',
    });

    // Generate token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      expiresIn: this.JWT_EXPIRATION,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Find user
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user can login with password (not a Google-only account)
    if (!user.passwordHash) {
      throw new UnauthorizedException(
        'Please use Google login for this account',
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(
      dto.password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      expiresIn: this.JWT_EXPIRATION,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  /**
   * Google OAuth Login
   * Verifies the id_token from Google and creates/maps user
   */
  async googleLogin(dto: GoogleLoginDto): Promise<AuthResponseDto> {
    // Verify Google token
    const googlePayload = await this.googleAuthService.verifyToken(dto.idToken);

    // Check if user exists by Google ID
    let user = await this.userRepository.findByGoogleId(googlePayload.sub);

    if (!user) {
      // Check if user exists by email (link accounts)
      user = await this.userRepository.findByEmail(googlePayload.email);

      if (user) {
        // User exists but not linked to Google - throw error
        // In a real app, you might want to link accounts
        throw new ConflictException(
          'Email already registered. Please login with password.',
        );
      }

      // Create new user from Google account
      user = await this.userRepository.create({
        email: googlePayload.email,
        googleId: googlePayload.sub,
        firstName: googlePayload.given_name || googlePayload.name.split(' ')[0],
        lastName:
          googlePayload.family_name ||
          googlePayload.name.split(' ').slice(1).join(' ') ||
          '',
        role: UserRole.CUSTOMER,
        authProvider: 'google',
      });
    }

    // Generate token
    const accessToken = this.generateToken(user.id, user.email, user.role);

    return {
      accessToken,
      expiresIn: this.JWT_EXPIRATION,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    };
  }

  private generateToken(userId: string, email: string, role: string): string {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload);
  }
}
