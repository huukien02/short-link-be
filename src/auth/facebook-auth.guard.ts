import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';

/** Header báo hiệu trình duyệt đang prefetch/preload (không phải điều hướng thật). */
function isPrefetch(req: Request): boolean {
  const h = req.headers;
  const secPurpose = String(h['sec-purpose'] ?? '');
  const purpose = String(h['purpose'] ?? h['x-purpose'] ?? h['x-moz'] ?? '');
  return /prefetch|prerender|preview/i.test(secPurpose + ' ' + purpose);
}

@Injectable()
export class FacebookAuthGuard extends AuthGuard('facebook') {
  private readonly logger = new Logger(FacebookAuthGuard.name);

  canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<Request>();

    if (req.query?.code) {
      this.logger.log(
        `FB callback hit | code=${String(req.query.code).slice(0, 10)}… ` +
          `| sec-purpose=${req.headers['sec-purpose'] ?? '-'} ` +
          `| sec-fetch-mode=${req.headers['sec-fetch-mode'] ?? '-'} ` +
          `| ip=${req.headers['cf-connecting-ip'] ?? req.headers['x-forwarded-for'] ?? '-'} ` +
          `| ua=${String(req.headers['user-agent'] ?? '-').slice(0, 50)}`,
      );
    }

    // Prefetch/preload sẽ "tiêu" mất code trước điều hướng thật → chặn lại,
    // KHÔNG cho đổi token, để chỉ request điều hướng thật mới redeem code.
    if (isPrefetch(req)) {
      this.logger.warn('Bỏ qua request prefetch tới FB callback (không redeem code)');
      throw new ForbiddenException('prefetch ignored');
    }

    return super.canActivate(context);
  }
}
