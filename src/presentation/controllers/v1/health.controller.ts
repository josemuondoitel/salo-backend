// Health Controller - API v1
import { Controller, Get } from '@nestjs/common';
import { Public } from '../../decorators/public.decorator';

@Controller('api/v1/health')
export class HealthController {
  @Public()
  @Get()
  health(): { status: string; timestamp: string; version: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: 'v1',
    };
  }
}
