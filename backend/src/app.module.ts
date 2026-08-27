import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { IntegrationsModule } from './integrations/integrations.module';

// Common Infrastructure
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { GlobalHttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { AuditLogInterceptor } from './common/interceptors/audit.interceptor';

// Domain Modules
import { AuthModule } from './modules/auth/auth.module';
import { AcademicsModule } from './modules/academics/academics.module';
import { StudentsModule } from './modules/students/students.module';
import { ParentsModule } from './modules/parents/parents.module';
import { TeachersModule } from './modules/teachers/teachers.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { ExaminationsModule } from './modules/examinations/examinations.module';
import { FinanceModule } from './modules/finance/finance.module';
import { PayrollModule } from './modules/payroll/payroll.module';
import { AdmissionsModule } from './modules/admissions/admissions.module';
import { CMSModule } from './modules/cms/cms.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AuditModule } from './modules/audit/audit.module';
import { HealthModule } from './modules/health/health.module';
import { BiometricModule } from './modules/biometric/biometric.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('app.throttle.ttl') || 60000,
          limit: config.get<number>('app.throttle.limit') || 100,
        },
      ],
    }),
    PrismaModule,
    IntegrationsModule,

    // Domain Modules
    AuthModule,
    AcademicsModule,
    StudentsModule,
    ParentsModule,
    TeachersModule,
    AttendanceModule,
    BiometricModule,
    ExaminationsModule,
    FinanceModule,
    PayrollModule,
    AdmissionsModule,
    CMSModule,
    NotificationsModule,
    AuditModule,
    HealthModule,
    UploadModule,
  ],
  providers: [
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },

    // Global Filters
    {
      provide: APP_FILTER,
      useClass: GlobalHttpExceptionFilter,
    },
    {
      provide: APP_FILTER,
      useClass: PrismaClientExceptionFilter,
    },
  ],
})
export class AppModule {}
