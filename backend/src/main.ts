import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  // Security Middleware
  app.use(helmet());
  app.use(cookieParser());

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // CORS Configuration
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: [
      frontendUrl,
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      /^http:\/\/localhost:\d+$/,
      /^http:\/\/127\.0\.0\.1:\d+$/,
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Requested-With'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Swagger / OpenAPI Setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('School Management System API')
    .setDescription(
      'Production-grade Modular Monolith REST API for School Management System (SMS). Serves Public Website, Student Portal, Parent Portal, Teacher Portal, and Admin Dashboard.',
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('Authentication')
    .addTag('Academics')
    .addTag('Students')
    .addTag('Parents')
    .addTag('Teachers')
    .addTag('Attendance')
    .addTag('Examinations & Results')
    .addTag('Finance & Accounting')
    .addTag('Payroll')
    .addTag('Admissions')
    .addTag('CMS & Public Content')
    .addTag('Notifications & SMS')
    .addTag('Audit & Security')
    .addTag('Health & Monitoring')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 School Management Backend running on: http://localhost:${port}/api/v1`);
  logger.log(`📚 Swagger API Documentation available on: http://localhost:${port}/api/docs`);
}

bootstrap();
