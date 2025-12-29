// Idempotency Key Decorator
import {
  createParamDecorator,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { Request } from 'express';

export const IDEMPOTENCY_KEY_HEADER = 'x-idempotency-key';

export const IdempotencyKey = createParamDecorator(
  (required: boolean = true, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const key = request.headers[IDEMPOTENCY_KEY_HEADER] as string | undefined;

    if (required && !key) {
      throw new BadRequestException(
        `Missing required header: ${IDEMPOTENCY_KEY_HEADER}`,
      );
    }

    return key;
  },
);
