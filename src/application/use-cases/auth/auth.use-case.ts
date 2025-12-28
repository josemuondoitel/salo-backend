// Authentication Use Cases
import { Injectable, Inject, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { IUserRepository, USER_REPOSITORY } from '../../../domain/repositories/user.repository.interface';
import { RegisterDto, LoginDto, AuthResponseDto } from '../../dtos/auth.dto';
import { UserRole } from '../../../domain/entities/user.entity';

@Injectable()
export class AuthUseCase {
  private readonly SALT_ROUNDS = 12;
  private readonly JWT_EXPIRATION: string;

  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepository: IUserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {
    this.JWT_EXPIRATION = this.configService.get<string>('JWT_EXPIRATION', '1h');
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

    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
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

  private generateToken(userId: string, email: string, role: string): string {
    const payload = {
      sub: userId,
      email,
      role,
    };

    return this.jwtService.sign(payload);
  }
}
