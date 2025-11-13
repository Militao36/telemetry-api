"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueTraces = void 0;
const bull_1 = __importDefault(require("bull"));
const traces_1 = require("./queues/traces");
const clickhouse_1 = require("../../databases/clickhouse");
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || '',
    port: Number(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
};
exports.queueTraces = new bull_1.default('traces', {
    redis: REDIS_CONFIG,
});
const traceJobProcessor = new traces_1.TraceJobProcessor({
    clickHouseClient: clickhouse_1.clientClickHouse
});
exports.queueTraces.process(traceJobProcessor.handle.bind(traceJobProcessor));
