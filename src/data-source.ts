import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { buildTypeOrmOptions } from './config/typeorm.config';

/**
 * DataSource cho TypeORM CLI (generate / run migration).
 * Đọc env qua ConfigService để dùng chung logic với app.
 */
const config = new ConfigService(process.env);

export default new DataSource(
  buildTypeOrmOptions(config) as DataSourceOptions,
);
