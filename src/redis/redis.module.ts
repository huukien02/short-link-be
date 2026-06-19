import {
  Global,
  Inject,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

/** Token DI cho client ioredis dùng chung (cache redirect, sau này cả BullMQ). */
export const REDIS_CLIENT = Symbol('REDIS_CLIENT');

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('REDIS_URL', 'redis://localhost:6379');
        const client = new Redis(url, {
          // Redis chỉ là lớp tăng tốc — không để nó làm treo app khi chưa kết nối được.
          maxRetriesPerRequest: 1,
          enableOfflineQueue: false,
          lazyConnect: false,
        });
        client.on('error', (err) => {
          // Nuốt lỗi ở mức client (vd Redis down) — code gọi đã có fallback DB.
          // Không log spam: chỉ log ngắn để biết trạng thái.
          // eslint-disable-next-line no-console
          console.warn(`[Redis] lỗi kết nối: ${err.message}`);
        });
        return client;
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule implements OnApplicationShutdown {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  async onApplicationShutdown(): Promise<void> {
    await this.client.quit();
  }
}
