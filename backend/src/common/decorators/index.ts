import { createParamDecorator, ExecutionContext, SetMetadata } from '@nestjs/common';
import { UserRoleType, AuditAction } from '@prisma/client';
import { IS_PUBLIC_KEY, ROLES_KEY, PERMISSIONS_KEY, AUDIT_META_KEY } from '../constants';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRoleType;
  username?: string | null;
  permissions: string[];
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;
    return data ? user?.[data] : user;
  },
);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const Roles = (...roles: UserRoleType[]) => SetMetadata(ROLES_KEY, roles);

export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);

export interface AuditMetadataOptions {
  action: AuditAction;
  entityName: string;
}

export const Audit = (options: AuditMetadataOptions) => SetMetadata(AUDIT_META_KEY, options);
