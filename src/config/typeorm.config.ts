import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Build options kết nối TypeORM từ biến môi trường.
 * Dùng chung cho NestJS (forRootAsync) và TypeORM CLI (data-source.ts).
 */
export function buildTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USER', 'postgres'),
    password: config.get<string>('DB_PASS', 'postgres'),
    database: config.get<string>('DB_NAME', 'urlshortener'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    migrations: [__dirname + '/../migrations/*{.ts,.js}'],
    // ⚠️ TẠM bật true để dev nhanh (auto-sync schema theo entity).
    // TODO: trả về false + dùng migration trước khi lên production (xem CLAUDE.md).
    synchronize: true,
    logging: config.get<string>('NODE_ENV') === 'development',
  };
}
