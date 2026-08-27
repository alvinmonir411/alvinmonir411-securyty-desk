import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRoleType } from '@prisma/client';
import { PERMISSIONS_KEY } from '../constants';
import { AuthenticatedUser } from '../decorators';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    if (!user) {
      throw new ForbiddenException('User authentication required for permission check.');
    }

    // SUPER_ADMIN bypasses all granular permission checks
    if (user.role === UserRoleType.SUPER_ADMIN) {
      return true;
    }

    const userPermissions = user.permissions || [];

    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasAllPermissions) {
      const missingPermissions = requiredPermissions.filter(
        (perm) => !userPermissions.includes(perm),
      );
      throw new ForbiddenException(
        `Forbidden resource. Missing required permission(s): ${missingPermissions.join(', ')}`,
      );
    }

    return true;
  }
}
