"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientClickHouse = void 0;
const client_1 = require("@clickhouse/client");
const env_1 = require("../../env");
exports.clientClickHouse = (0, client_1.createClient)({
    url: env_1.CLICKHOUSE_URL,
    username: env_1.CLICKHOUSE_USER,
    password: env_1.CLICKHOUSE_PASSWORD,
    database: env_1.CLICKHOUSE_DATABASE,
});
