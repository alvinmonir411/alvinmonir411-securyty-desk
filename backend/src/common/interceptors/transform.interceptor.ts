import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpStatus,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { StandardResponseDto } from '../dto';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, StandardResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<StandardResponseDto<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const statusCode = response.statusCode || HttpStatus.OK;

    return next.handle().pipe(
      map((resData) => {
        // If data is already in standard format (e.g. paginated result with meta)
        if (resData && typeof resData === 'object' && 'data' in resData && 'meta' in resData) {
          return {
            success: true,
            statusCode,
            message: (resData as { message?: string }).message || 'Operation successful',
            data: (resData as { data: T }).data,
            meta: (resData as { meta: any }).meta,
            timestamp: new Date().toISOString(),
          };
        }

        return {
          success: true,
          statusCode,
          message: 'Operation successful',
          data: resData,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}
