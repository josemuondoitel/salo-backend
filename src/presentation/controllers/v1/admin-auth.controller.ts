// Admin Authentication Controller - API v1
// SEPARATE from user authentication
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import {
  AdminAuthUseCase,
  AdminAuthResponseDto,
} from '../../../application/use-cases/admin-auth/admin-auth.use-case';
import { Public } from '../../decorators/public.decorator';
import { IsEmail, IsString, MinLength } from 'class-validator';

class AdminLoginRequestDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;
}

@Controller('api/v1/admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthUseCase: AdminAuthUseCase) {}

  /**
   * Admin login - SEPARATE from user login
   * Uses different JWT secret, issuer, and claims
   */
  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: AdminLoginRequestDto,
  ): Promise<AdminAuthResponseDto> {
    return this.adminAuthUseCase.login(dto);
  }
}
