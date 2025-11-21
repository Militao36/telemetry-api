"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueLogs = exports.queueTraces = void 0;
const bull_1 = __importDefault(require("bull"));
const traces_1 = require("./queues/traces");
const env_1 = require("../../env");
const clickhouse_1 = require("../../databases/clickhouse");
const REDIS_CONFIG = {
    host: env_1.REDIS_HOST,
    port: env_1.REDIS_PORT,
    password: env_1.REDIS_PASSWORD,
};
exports.queueTraces = new bull_1.default('traces', {
    redis: REDIS_CONFIG,
});
exports.queueLogs = new bull_1.default('logs', {
    redis: REDIS_CONFIG,
});
const traceJobProcessor = new traces_1.TraceJobProcessor({
    clickHouseClient: clickhouse_1.clientClickHouse,
});
exports.queueTraces.process(traceJobProcessor.handle.bind(traceJobProcessor));
