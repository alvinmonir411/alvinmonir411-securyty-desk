import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { PermissionsGuard } from './permissions.guard';
import { UserRoleType } from '@prisma/client';

describe('Authorization Guards (Role & Permission-Based Access Control)', () => {
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
  });

  describe('1. RolesGuard', () => {
    let rolesGuard: RolesGuard;

    beforeEach(() => {
      rolesGuard = new RolesGuard(reflector);
    });

    const createMockContext = (user: any): ExecutionContext => {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    };

    it('should allow access when route has no required roles', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const context = createMockContext({ role: UserRoleType.STUDENT });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should grant access to SUPER_ADMIN on any role-restricted route', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleType.ADMIN, UserRoleType.TEACHER]);
      const context = createMockContext({ role: UserRoleType.SUPER_ADMIN });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should grant access when user has matching role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleType.TEACHER, UserRoleType.ACCOUNTANT]);
      const context = createMockContext({ role: UserRoleType.TEACHER });

      expect(rolesGuard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user has unauthorized role', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([UserRoleType.ADMIN, UserRoleType.ACCOUNTANT]);
      const context = createMockContext({ role: UserRoleType.STUDENT });

      expect(() => rolesGuard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('2. PermissionsGuard', () => {
    let permissionsGuard: PermissionsGuard;

    beforeEach(() => {
      permissionsGuard = new PermissionsGuard(reflector);
    });

    const createMockContext = (user: any): ExecutionContext => {
      return {
        getHandler: jest.fn(),
        getClass: jest.fn(),
        switchToHttp: () => ({
          getRequest: () => ({ user }),
        }),
      } as unknown as ExecutionContext;
    };

    it('should allow access when route has no required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
      const context = createMockContext({ role: UserRoleType.STUDENT, permissions: [] });

      expect(permissionsGuard.canActivate(context)).toBe(true);
    });

    it('should grant access to SUPER_ADMIN unconditionally', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['students.delete', 'payroll.approve']);
      const context = createMockContext({ role: UserRoleType.SUPER_ADMIN, permissions: [] });

      expect(permissionsGuard.canActivate(context)).toBe(true);
    });

    it('should grant access when user possesses all required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['students.read', 'students.create']);
      const context = createMockContext({
        role: UserRoleType.ADMIN,
        permissions: ['students.read', 'students.create', 'students.update'],
      });

      expect(permissionsGuard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user lacks one or more required permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['students.delete', 'payroll.approve']);
      const context = createMockContext({
        role: UserRoleType.TEACHER,
        permissions: ['students.read', 'attendance.create'],
      });

      expect(() => permissionsGuard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => permissionsGuard.canActivate(context)).toThrow(
        /Forbidden resource\. Missing required permission/,
      );
    });
  });
});
