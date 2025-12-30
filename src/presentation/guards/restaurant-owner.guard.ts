// Restaurant Owner Guard - Ensures user is a restaurant owner
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../../infrastructure/security/jwt.strategy';

@Injectable()
export class RestaurantOwnerGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: JwtPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    if (user.role !== 'RESTAURANT_OWNER') {
      throw new ForbiddenException(
        'Access denied: Restaurant owner role required',
      );
    }

    return true;
  }
}
