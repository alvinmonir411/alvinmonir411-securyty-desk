import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../../integrations/email/email.service';
import {
  LoginDto,
  RefreshTokenDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto/auth.dto';
import { UserRoleType, UserStatus, AuditAction, LoginStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  private extractPermissions(user: any): string[] {
    const allPermissions = [
      'students.read', 'students.create', 'students.update', 'students.delete',
      'fees.read', 'fees.create', 'fees.collect', 'fees.refund',
      'results.read', 'results.create', 'results.update', 'results.publish',
      'attendance.read', 'attendance.create', 'attendance.update',
      'payroll.read', 'payroll.create', 'payroll.approve',
      'cms.read', 'cms.create', 'cms.update', 'cms.delete',
      'audit.read',
    ];

    if (user.role === UserRoleType.SUPER_ADMIN) {
      return allPermissions;
    }

    const permissionsSet = new Set<string>();

    if (user.userRoleRef?.permissions) {
      user.userRoleRef.permissions.forEach((rp: any) => {
        if (rp.permission?.name) {
          permissionsSet.add(rp.permission.name);
        }
      });
    }

    if (user.userRoles) {
      user.userRoles.forEach((ur: any) => {
        ur.role?.permissions?.forEach((rp: any) => {
          if (rp.permission?.name) {
            permissionsSet.add(rp.permission.name);
          }
        });
      });
    }

    return Array.from(permissionsSet);
  }

  async login(dto: LoginDto, ipAddress: string = '127.0.0.1', userAgent: string = 'Unknown') {
    const emailNormalized = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
      include: {
        userRoleRef: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      await this.prisma.loginHistory.create({
        data: {
          email: emailNormalized,
          ipAddress,
          userAgent,
          status: LoginStatus.FAILED,
          failureReason: 'User does not exist',
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.ACTIVE || user.deletedAt) {
      await this.prisma.loginHistory.create({
        data: {
          userId: user.id,
          email: emailNormalized,
          ipAddress,
          userAgent,
          status: LoginStatus.BLOCKED,
          failureReason: 'Account inactive or suspended',
        },
      });
      throw new UnauthorizedException('Your account is inactive, suspended, or archived.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { failedLoginCount: { increment: 1 } },
      });

      await this.prisma.loginHistory.create({
        data: {
          userId: user.id,
          email: emailNormalized,
          ipAddress,
          userAgent,
          status: LoginStatus.FAILED,
          failureReason: 'Invalid credentials',
        },
      });

      throw new UnauthorizedException('Invalid email or password');
    }

    // Reset failed login counter and record login timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lastLoginAt: new Date(),
      },
    });

    // Record successful login history
    await this.prisma.loginHistory.create({
      data: {
        userId: user.id,
        email: emailNormalized,
        ipAddress,
        userAgent,
        status: LoginStatus.SUCCESS,
      },
    });

    const permissions = this.extractPermissions(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('app.jwt.accessSecret') || 'super-secret-jwt-access-key-2026-production',
      expiresIn: this.config.get<string>('app.jwt.accessExpiration') || '15m',
    });

    // Generate DB-backed cryptographically secure Refresh Token
    const refreshTokenPlain = uuidv4();
    const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        userId: user.id,
        deviceInfo: userAgent,
        ipAddress,
        expiresAt,
      },
    });

    // Create / register active device Session
    const sessionToken = uuidv4();
    await this.prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        ipAddress,
        userAgent,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      expiresIn: 900, // 15 minutes in seconds
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        status: user.status,
        avatarUrl: user.avatarUrl,
        permissions,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto, ipAddress: string = '127.0.0.1', userAgent: string = 'Unknown') {
    if (!dto.refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            userRoleRef: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
            userRoles: {
              include: {
                role: {
                  include: {
                    permissions: {
                      include: { permission: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let matchedToken: (typeof tokens)[0] | null = null;

    for (const t of tokens) {
      const isMatch = await bcrypt.compare(dto.refreshToken, t.tokenHash);
      if (isMatch) {
        matchedToken = t;
        break;
      }
    }

    if (!matchedToken || !matchedToken.user || matchedToken.user.status !== UserStatus.ACTIVE || matchedToken.user.deletedAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Refresh Token Rotation: Revoke current refresh token
    await this.prisma.refreshToken.update({
      where: { id: matchedToken.id },
      data: { isRevoked: true },
    });

    const user = matchedToken.user;
    const permissions = this.extractPermissions(user);

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      permissions,
    };

    const newAccessToken = this.jwtService.sign(payload, {
      secret: this.config.get<string>('app.jwt.accessSecret') || 'super-secret-jwt-access-key-2026-production',
      expiresIn: this.config.get<string>('app.jwt.accessExpiration') || '15m',
    });

    const newRefreshTokenPlain = uuidv4();
    const newRefreshTokenHash = await bcrypt.hash(newRefreshTokenPlain, 10);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: newRefreshTokenHash,
        userId: user.id,
        deviceInfo: userAgent,
        ipAddress,
        expiresAt,
      },
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshTokenPlain,
      expiresIn: 900,
    };
  }

  async logout(userId: string) {
    // Revoke all active refresh tokens and sessions for this user
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: AuditAction.LOGOUT,
        entityName: 'User',
        entityId: userId,
      },
    });

    return { success: true, message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User profile not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password does not match');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all active sessions and refresh tokens to enforce re-login
    await this.prisma.refreshToken.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.session.updateMany({
      where: { userId, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.auditLog.create({
      data: {
        actorId: userId,
        action: AuditAction.UPDATE,
        entityName: 'UserPassword',
        entityId: userId,
      },
    });

    return {
      success: true,
      message: 'Password changed successfully. All other sessions have been logged out.',
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const emailNormalized = dto.email.toLowerCase().trim();
    const user = await this.prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (user && user.status === UserStatus.ACTIVE && !user.deletedAt) {
      // Create a short-lived reset token (15 mins)
      const resetToken = this.jwtService.sign(
        { sub: user.id, email: user.email, type: 'PASSWORD_RESET' },
        {
          secret: this.config.get<string>('app.jwt.accessSecret') || 'super-secret-jwt-access-key-2026-production',
          expiresIn: '15m',
        },
      );

      // Send password reset email
      const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
      await this.emailService.sendEmail({
        to: user.email,
        subject: 'Apex Academy - Password Reset Request',
        html: `<p>Hello,</p><p>You requested a password reset. Click the link below to set a new password (valid for 15 minutes):</p><p><a href="${resetLink}">Reset My Password</a></p><p>If you did not request this, please ignore this email.</p>`,
      });
    }

    // Always return success to prevent email enumeration attacks
    return {
      success: true,
      message: 'If an account exists with this email address, a password reset link has been dispatched.',
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.token, {
        secret: this.config.get<string>('app.jwt.accessSecret') || 'super-secret-jwt-access-key-2026-production',
      });
    } catch {
      throw new BadRequestException('Password reset token is invalid or has expired.');
    }

    if (payload.type !== 'PASSWORD_RESET' || !payload.sub) {
      throw new BadRequestException('Invalid password reset token format.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new NotFoundException('User not found or account is inactive.');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // Revoke all existing sessions
    await this.prisma.refreshToken.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    await this.prisma.session.updateMany({
      where: { userId: user.id, isRevoked: false },
      data: { isRevoked: true },
    });

    return {
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new credentials.',
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        student: {
          include: {
            enrollments: {
              where: { isActive: true },
              include: { section: { include: { class: true } } },
            },
          },
        },
        teacher: {
          include: {
            teacherSubjects: {
              include: { subject: true, section: { include: { class: true } } },
            },
          },
        },
        parent: {
          include: {
            students: {
              include: { student: true },
            },
          },
        },
        userRoleRef: {
          include: {
            permissions: {
              include: { permission: true },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User profile not found');
    }

    const permissions = this.extractPermissions(user);

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      status: user.status,
      avatarUrl: user.avatarUrl,
      permissions,
      student: user.student,
      teacher: user.teacher,
      parent: user.parent,
      roles: user.userRoles.map((ur: any) => ur.role.name),
    };
  }

  async getUserSessions(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, isRevoked: false },
      orderBy: { lastActiveAt: 'desc' },
    });
  }

  async revokeSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findFirst({
      where: { id: sessionId, userId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    await this.prisma.session.update({
      where: { id: sessionId },
      data: { isRevoked: true },
    });

    return { success: true, message: 'Session revoked successfully' };
  }

  async getLoginHistory(userId: string) {
    return this.prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { loggedAt: 'desc' },
      take: 20,
    });
  }
}
