import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
export interface ApiSuccess<T> {
    success: true;
    data: T;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, ApiSuccess<T>> {
    intercept(_context: ExecutionContext, next: CallHandler<T>): Observable<ApiSuccess<T>>;
}
