// Correlation ID Interceptor - Adds correlation ID to all requests
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response } from 'express';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get or generate correlation ID
    let correlationId = request.headers[CORRELATION_ID_HEADER] as string | undefined;
    
    if (!correlationId) {
      correlationId = uuidv4();
    }

    // Attach to request for use in handlers
    (request as Request & { correlationId: string }).correlationId = correlationId;

    return next.handle().pipe(
      tap(() => {
        // Add correlation ID to response headers
        response.setHeader(CORRELATION_ID_HEADER, correlationId!);
      })
    );
  }
}
