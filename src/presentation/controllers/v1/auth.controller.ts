// Authentication Controller - API v1
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthUseCase } from '../../../application/use-cases/auth/auth.use-case';
import { RegisterDto, LoginDto, AuthResponseDto } from '../../../application/dtos/auth.dto';
import { Public } from '../../decorators/public.decorator';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authUseCase: AuthUseCase) {}

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authUseCase.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authUseCase.login(dto);
  }
}
