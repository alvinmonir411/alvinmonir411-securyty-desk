import { Module, Injectable, Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { Roles, Permissions } from '../../common/decorators';
import { PaginationQueryDto } from '../../common/dto';
import { UserRoleType } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async getLogs(query: PaginationQueryDto) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [totalItems, data] = await Promise.all([
      this.prisma.auditLog.count(),
      this.prisma.auditLog.findMany({
        skip,
        take: limit,
        include: {
          actor: { select: { email: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
        hasNextPage: page * limit < totalItems,
        hasPrevPage: page > 1,
      },
    };
  }
}

@ApiTags('Audit & Security')
@ApiBearerAuth()
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get('logs')
  @Roles(UserRoleType.SUPER_ADMIN, UserRoleType.ADMIN)
  @Permissions('audit.read')
  @ApiOperation({ summary: 'Query immutable security audit logs' })
  async getLogs(@Query() query: PaginationQueryDto) {
    return this.auditService.getLogs(query);
  }
}

@Module({
  controllers: [AuditController],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
