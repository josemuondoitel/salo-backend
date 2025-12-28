// Idempotency Service - Redis backed
import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface IdempotencyResult {
  exists: boolean;
  response?: {
    statusCode: number;
    body: unknown;
  };
}

@Injectable()
export class IdempotencyService {
  private readonly PREFIX = 'idempotency:';
  private readonly DEFAULT_TTL = 24 * 60 * 60; // 24 hours

  constructor(private readonly redis: RedisService) {}

  private getKey(idempotencyKey: string): string {
    return `${this.PREFIX}${idempotencyKey}`;
  }

  /**
   * Check if an idempotency key exists
   * If it exists, return the cached response
   */
  async check(idempotencyKey: string): Promise<IdempotencyResult> {
    const key = this.getKey(idempotencyKey);
    const cached = await this.redis.get(key);

    if (cached) {
      const parsed = JSON.parse(cached) as { statusCode: number; body: unknown };
      return {
        exists: true,
        response: parsed,
      };
    }

    return { exists: false };
  }

  /**
   * Store the response for an idempotency key
   */
  async store(
    idempotencyKey: string,
    statusCode: number,
    body: unknown,
    ttlSeconds: number = this.DEFAULT_TTL
  ): Promise<void> {
    const key = this.getKey(idempotencyKey);
    const value = JSON.stringify({ statusCode, body });
    await this.redis.set(key, value, ttlSeconds);
  }

  /**
   * Invalidate an idempotency key
   */
  async invalidate(idempotencyKey: string): Promise<void> {
    const key = this.getKey(idempotencyKey);
    await this.redis.del(key);
  }
}
