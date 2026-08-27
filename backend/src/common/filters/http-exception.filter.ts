import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse: unknown = exception.getResponse();

    let message = exception.message;
    let errors: unknown = undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const obj = exceptionResponse as Record<string, unknown>;
      if (obj.message) {
        if (Array.isArray(obj.message)) {
          errors = obj.message;
          message = 'Validation failed';
        } else if (typeof obj.message === 'string') {
          message = obj.message;
        }
      }
      if (obj.error && !errors) {
        errors = obj.error;
      }
    }

    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status} - Message: ${message}`,
    );

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
