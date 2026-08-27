import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import { UserRoleType, UserStatus } from '@prisma/client';

describe('AuthService (Unit & Security Tests)', () => {
  let authService: AuthService;
  let prismaService: any;
  let jwtService: any;
  let emailService: any;

  const mockHashedPassword = bcrypt.hashSync('Admin@123456', 10);

  const mockUser = {
    id: 'user-uuid-1',
    email: 'admin@school.edu',
    username: 'superadmin',
    passwordHash: mockHashedPassword,
    role: UserRoleType.SUPER_ADMIN,
    status: UserStatus.ACTIVE,
    failedLoginCount: 0,
    deletedAt: null,
    userRoleRef: {
      permissions: [
        { permission: { name: 'students.read' } },
        { permission: { name: 'students.create' } },
      ],
    },
    userRoles: [],
  };

  beforeEach(async () => {
    prismaService = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      loginHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      refreshToken: {
        create: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      session: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mocked-jwt-access-token'),
      verify: jest.fn(),
    };

    emailService = {
      sendEmail: jest.fn().mockResolvedValue(true),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaService },
        { provide: JwtService, useValue: jwtService },
        { provide: EmailService, useValue: emailService },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'app.jwt.accessSecret') return 'test-secret';
              if (key === 'app.jwt.accessExpiration') return '15m';
              return null;
            }),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  describe('1. Login Flow', () => {
    it('should successfully authenticate valid user and return access + refresh tokens', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.loginHistory.create.mockResolvedValue({});
      prismaService.refreshToken.create.mockResolvedValue({});
      prismaService.session.create.mockResolvedValue({});

      const result = await authService.login(
        { email: 'admin@school.edu', password: 'Admin@123456' },
        '192.168.1.1',
        'Mozilla/5.0 Test Agent',
      );

      expect(result).toHaveProperty('accessToken', 'mocked-jwt-access-token');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('admin@school.edu');
      expect(result.user.role).toBe(UserRoleType.SUPER_ADMIN);
      expect(result.user.permissions).toContain('students.read');
      expect(result.user.permissions).toContain('students.create');
      expect(prismaService.loginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'SUCCESS' }),
        }),
      );
    });

    it('should throw UnauthorizedException on invalid password and log failed attempt', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.loginHistory.create.mockResolvedValue({});

      await expect(
        authService.login({ email: 'admin@school.edu', password: 'WrongPassword999' }),
      ).rejects.toThrow(UnauthorizedException);

      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { failedLoginCount: { increment: 1 } },
      });
      expect(prismaService.loginHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'FAILED' }),
        }),
      );
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      prismaService.user.findUnique.mockResolvedValue(null);
      prismaService.loginHistory.create.mockResolvedValue({});

      await expect(
        authService.login({ email: 'nonexistent@school.edu', password: 'Password@123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is INACTIVE or SUSPENDED', async () => {
      prismaService.user.findUnique.mockResolvedValue({
        ...mockUser,
        status: UserStatus.SUSPENDED,
      });
      prismaService.loginHistory.create.mockResolvedValue({});

      await expect(
        authService.login({ email: 'admin@school.edu', password: 'Admin@123456' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('2. Refresh Token & Rotation Flow', () => {
    it('should rotate refresh token and issue new token pair', async () => {
      const rawRefreshToken = 'valid-refresh-token-uuid';
      const tokenHash = bcrypt.hashSync(rawRefreshToken, 10);

      prismaService.refreshToken.findMany.mockResolvedValue([
        {
          id: 'token-1',
          tokenHash,
          isRevoked: false,
          expiresAt: new Date(Date.now() + 100000),
          user: mockUser,
        },
      ]);
      prismaService.refreshToken.update.mockResolvedValue({});
      prismaService.refreshToken.create.mockResolvedValue({});

      const result = await authService.refreshToken({ refreshToken: rawRefreshToken });

      expect(result).toHaveProperty('accessToken', 'mocked-jwt-access-token');
      expect(result).toHaveProperty('refreshToken');
      // Verify old token was revoked
      expect(prismaService.refreshToken.update).toHaveBeenCalledWith({
        where: { id: 'token-1' },
        data: { isRevoked: true },
      });
      // Verify new token was created
      expect(prismaService.refreshToken.create).toHaveBeenCalled();
    });

    it('should reject invalid or expired refresh token with UnauthorizedException', async () => {
      prismaService.refreshToken.findMany.mockResolvedValue([]);

      await expect(
        authService.refreshToken({ refreshToken: 'invalid-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('3. Logout Flow', () => {
    it('should revoke all active tokens, sessions and create audit log', async () => {
      prismaService.refreshToken.updateMany.mockResolvedValue({ count: 2 });
      prismaService.session.updateMany.mockResolvedValue({ count: 1 });
      prismaService.auditLog.create.mockResolvedValue({});

      const result = await authService.logout('user-uuid-1');

      expect(result.success).toBe(true);
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRevoked: false },
        data: { isRevoked: true },
      });
      expect(prismaService.session.updateMany).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1', isRevoked: false },
        data: { isRevoked: true },
      });
    });
  });

  describe('4. Password Change Flow', () => {
    it('should verify current password, update password hash, and revoke sessions', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.refreshToken.updateMany.mockResolvedValue({});
      prismaService.session.updateMany.mockResolvedValue({});
      prismaService.auditLog.create.mockResolvedValue({});

      const result = await authService.changePassword('user-uuid-1', {
        currentPassword: 'Admin@123456',
        newPassword: 'BrandNewPassword@2026',
      });

      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalled();
      expect(prismaService.session.updateMany).toHaveBeenCalled();
    });

    it('should throw BadRequestException if current password is wrong', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      await expect(
        authService.changePassword('user-uuid-1', {
          currentPassword: 'IncorrectPassword',
          newPassword: 'BrandNewPassword@2026',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('5. Forgot & Reset Password Flow', () => {
    it('should send reset email on valid forgot password request', async () => {
      prismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await authService.forgotPassword({ email: 'admin@school.edu' });

      expect(result.success).toBe(true);
      expect(emailService.sendEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'admin@school.edu',
          subject: expect.stringContaining('Password Reset'),
        }),
      );
    });

    it('should successfully reset password with valid token and revoke sessions', async () => {
      jwtService.verify.mockReturnValue({
        sub: 'user-uuid-1',
        email: 'admin@school.edu',
        type: 'PASSWORD_RESET',
      });
      prismaService.user.findUnique.mockResolvedValue(mockUser);
      prismaService.user.update.mockResolvedValue(mockUser);
      prismaService.refreshToken.updateMany.mockResolvedValue({});
      prismaService.session.updateMany.mockResolvedValue({});

      const result = await authService.resetPassword({
        token: 'valid-reset-jwt-token',
        newPassword: 'NewlyResetPassword@2026',
      });

      expect(result.success).toBe(true);
      expect(prismaService.user.update).toHaveBeenCalled();
      expect(prismaService.refreshToken.updateMany).toHaveBeenCalled();
    });
  });
});
