import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';
import { PrismaService } from '../../database/prisma.service';
import { AUDIT_META_KEY } from '../constants';
import { AuditMetadataOptions, AuthenticatedUser } from '../decorators';
import { AuditAction } from '@prisma/client';

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const auditMeta = this.reflector.get<AuditMetadataOptions | undefined>(
      AUDIT_META_KEY,
      context.getHandler(),
    );

    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method);

    return next.handle().pipe(
      tap({
        next: (data) => {
          if (auditMeta || isMutation) {
            this.recordAuditLog(request, auditMeta, data).catch((err) =>
              this.logger.error(`Failed to record audit log: ${err.message}`),
            );
          }
        },
      }),
    );
  }

  private async recordAuditLog(
    request: Request,
    auditMeta?: AuditMetadataOptions,
    responseData?: any,
  ) {
    try {
      const user = request.user as AuthenticatedUser | undefined;
      const action = auditMeta?.action || this.mapMethodToAction(request.method);
      const entityName = auditMeta?.entityName || request.baseUrl.split('/').pop() || 'Unknown';
      const entityId = request.params?.id || responseData?.id || responseData?.data?.id || null;

      await this.prisma.auditLog.create({
        data: {
          actorId: user?.id || null,
          action,
          entityName,
          entityId: entityId ? String(entityId) : null,
          afterState: responseData ? JSON.parse(JSON.stringify(responseData)) : undefined,
          ipAddress: (request.headers['x-forwarded-for'] as string) || request.ip || '127.0.0.1',
          userAgent: request.headers['user-agent'] || 'Unknown',
        },
      });
    } catch (e: any) {
      this.logger.warn(`Could not save audit log: ${e.message}`);
    }
  }

  private mapMethodToAction(method: string): AuditAction {
    switch (method) {
      case 'POST':
        return AuditAction.CREATE;
      case 'PUT':
      case 'PATCH':
        return AuditAction.UPDATE;
      case 'DELETE':
        return AuditAction.DELETE;
      default:
        return AuditAction.UPDATE;
    }
  }
}
