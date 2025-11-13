"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const trace_service_1 = require("./services/trace.service");
const awilix_1 = require("awilix");
const clickhouse_1 = require("./databases/clickhouse");
const bull_1 = require("./queues/bull");
const traces_1 = require("./queues/bull/queues/traces");
const normalizeOtlpHttpJsonTrace_1 = require("./queues/bull/utils/normalizeOtlpHttpJsonTrace");
const container = (0, awilix_1.createContainer)();
exports.container = container;
container.register({
    clickHouseClient: (0, awilix_1.asValue)(clickhouse_1.clientClickHouse),
    traceService: (0, awilix_1.asClass)(trace_service_1.TracesService).singleton(),
    traceJobProcessor: (0, awilix_1.asClass)(traces_1.TraceJobProcessor).singleton(),
    queueTraces: (0, awilix_1.asValue)(bull_1.queueTraces),
    normalizeOTLP: (0, awilix_1.asValue)(normalizeOtlpHttpJsonTrace_1.normalizeOTLP),
});
