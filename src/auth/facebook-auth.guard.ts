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

/**
 * Bot quét link (đặc biệt `facebookexternalhit` của Facebook) ghé URL callback
 * trước điều hướng thật → "tiêu" mất authorization code (chỉ dùng được 1 lần).
 * Chặn chúng, không cho redeem code.
 */
function isLinkCrawler(req: Request): boolean {
  const ua = String(req.headers['user-agent'] ?? '');
  return /facebookexternalhit|facebookcatalog|meta-externalagent|facebookbot|bot\b|crawler|spider|slurp|preview/i.test(
    ua,
  );
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

    // Prefetch/preload hoặc bot quét link (facebookexternalhit) sẽ "tiêu" mất
    // code trước điều hướng thật → chặn lại, KHÔNG redeem code, để chỉ request
    // điều hướng thật của người dùng mới đổi token.
    if (isPrefetch(req) || isLinkCrawler(req)) {
      this.logger.warn(
        `Bỏ qua request không phải điều hướng thật tới FB callback ` +
          `(ua=${String(req.headers['user-agent'] ?? '-').slice(0, 40)})`,
      );
      throw new ForbiddenException('non-navigation request ignored');
    }

    return super.canActivate(context);
  }
}
