import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  private readonly logger = new Logger(FacebookAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();
    // Log mỗi lần callback chạy để phát hiện code bị đổi 2 lần (double-call)
    if (req.query?.code) {
      this.logger.log(
        `FB callback hit | code=${String(req.query.code).slice(0, 10)}… | url=${req.url}`,
      );
    }
    return super.canActivate(context);
  }
}
