"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildTypeOrmOptions = buildTypeOrmOptions;
function buildTypeOrmOptions(config) {
    return {
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get('DB_PORT', 5432),
        username: config.get('DB_USER', 'postgres'),
        password: config.get('DB_PASS', 'postgres'),
        database: config.get('DB_NAME', 'urlshortener'),
        entities: [__dirname + '/../**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/../migrations/*{.ts,.js}'],
        synchronize: true,
        logging: config.get('NODE_ENV') === 'development',
    };
}
//# sourceMappingURL=typeorm.config.js.map