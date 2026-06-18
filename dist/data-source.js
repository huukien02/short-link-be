"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const typeorm_config_1 = require("./config/typeorm.config");
const config = new config_1.ConfigService(process.env);
exports.default = new typeorm_1.DataSource((0, typeorm_config_1.buildTypeOrmOptions)(config));
//# sourceMappingURL=data-source.js.map