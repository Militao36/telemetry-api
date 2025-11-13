export const AWILIX_CONTROLLERS = process.env.AWILIX_CONTROLLERS || 'controllers/**/*.ts';
export const CLICKHOUSE_URL = process.env.CLICKHOUSE_URL || 'http://localhost:8123';
export const CLICKHOUSE_USER = process.env.CLICKHOUSE_USER || 'analytics_user';
export const CLICKHOUSE_PASSWORD = process.env.CLICKHOUSE_PASSWORD || 'analytics_password';
export const CLICKHOUSE_DATABASE = process.env.CLICKHOUSE_DATABASE || 'telemetry';
export const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3333;