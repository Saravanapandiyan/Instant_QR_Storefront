import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    const isSuperAdmin = user.role === 'SUPER_ADMIN' || user.isPlatformAdmin === true;

    if (!isSuperAdmin) {
      throw new ForbiddenException(
        'Access denied. This endpoint is strictly restricted to Platform Super Administrators.',
      );
    }

    return true;
  }
}

