"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PORT = exports.CLICKHOUSE_DATABASE = exports.CLICKHOUSE_PASSWORD = exports.CLICKHOUSE_USER = exports.CLICKHOUSE_URL = exports.AWILIX_CONTROLLERS = void 0;
exports.AWILIX_CONTROLLERS = process.env.AWILIX_CONTROLLERS || 'controllers/**/*.ts';
exports.CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
exports.CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || 'analytics_user';
exports.CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || 'analytics_password';
exports.CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || 'telemetry';
exports.PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;
