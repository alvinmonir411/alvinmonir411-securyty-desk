import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../database/prisma.service';
import { AuthenticatedUser } from '../../common/decorators';
import { UserRoleType, UserStatus } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRoleType;
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('app.jwt.accessSecret') || 'super-secret-jwt-access-key-2026-production',
    });
  }

  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: {
        userRoleRef: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        userRoles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE || user.deletedAt) {
      throw new UnauthorizedException('User account is inactive, suspended, or does not exist');
    }

    const permissionsSet = new Set<string>();

    if (user.userRoleRef?.permissions) {
      user.userRoleRef.permissions.forEach((rp) => {
        if (rp.permission?.name) {
          permissionsSet.add(rp.permission.name);
        }
      });
    }

    if (user.userRoles) {
      user.userRoles.forEach((ur) => {
        ur.role?.permissions?.forEach((rp) => {
          if (rp.permission?.name) {
            permissionsSet.add(rp.permission.name);
          }
        });
      });
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      permissions: Array.from(permissionsSet),
    };
  }
}
