import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { TransformInterceptor } from './common/transform.interceptor';

async function bootstrap() {
  // rawBody: true → giữ Buffer body gốc cho webhook Stripe (cần verify chữ ký),
  // mà KHÔNG phá JSON parser toàn cục của các route khác.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });

  // Sau proxy (Render/Railway): tin x-forwarded-for để req.ip là IP client thật
  // (cần cho geo lookup) và để rate-limit theo đúng IP.
  app.set('trust proxy', 1);

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Cấu trúc trả về chung: { success: true, data } / { success: false, error }
  app.useGlobalInterceptors(new TransformInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
