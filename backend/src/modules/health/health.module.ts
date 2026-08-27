import { Module, Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PrismaService } from '../../database/prisma.service';
import { Public } from '../../common/decorators';

@ApiTags('Health & Monitoring')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'System health and readiness check' })
  async check() {
    let dbStatus = 'down';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      dbStatus = 'up';
    } catch {
      dbStatus = 'unreachable';
    }

    return {
      status: 'ok',
      database: dbStatus,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}

@Module({
  controllers: [HealthController],
})
export class HealthModule {}
