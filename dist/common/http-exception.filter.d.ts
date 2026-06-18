import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
export interface ApiError {
    success: false;
    error: {
        statusCode: number;
        message: string | string[];
        error: string;
        path: string;
        timestamp: string;
    };
}
export declare class HttpExceptionFilter implements ExceptionFilter {
    private readonly logger;
    catch(exception: unknown, host: ArgumentsHost): void;
}
