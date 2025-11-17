"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const trace_service_1 = require("./services/trace.service");
const awilix_1 = require("awilix");
const clickhouse_1 = require("./databases/clickhouse");
const bull_1 = require("./queues/bull");
const traces_1 = require("./queues/bull/queues/traces");
const normalizeOtlpHttpJsonTrace_1 = require("./queues/bull/utils/normalizeOtlpHttpJsonTrace");
const logger_1 = require("./config/logger");
const redis_1 = require("./databases/redis");
const normalizeLog_1 = require("./queues/bull/utils/normalizeLog");
const dash_service_1 = require("./services/dash.service");
const dash_repository_1 = require("./repositories/dash.repository");
const queries_service_1 = require("./services/queries.service");
const queries_repository_1 = require("./repositories/queries.repository");
const container = (0, awilix_1.createContainer)();
exports.container = container;
container.register({
    logger: (0, awilix_1.asValue)(logger_1.logger),
    clickHouseClient: (0, awilix_1.asValue)(clickhouse_1.clientClickHouse),
    clientRedis: (0, awilix_1.asValue)(redis_1.clientRedis),
    traceService: (0, awilix_1.asClass)(trace_service_1.TracesService).singleton(),
    dashService: (0, awilix_1.asClass)(dash_service_1.DashService).singleton(),
    queriesService: (0, awilix_1.asClass)(queries_service_1.QueriesService).singleton(),
    dashRepository: (0, awilix_1.asClass)(dash_repository_1.DashRepository).singleton(),
    queriesRepository: (0, awilix_1.asClass)(queries_repository_1.QueriesRepository).singleton(),
    traceJobProcessor: (0, awilix_1.asClass)(traces_1.TraceJobProcessor).singleton(),
    queueTraces: (0, awilix_1.asValue)(bull_1.queueTraces),
    normalizeOTLP: (0, awilix_1.asValue)(normalizeOtlpHttpJsonTrace_1.normalizeOTLP),
    normalizeLog: (0, awilix_1.asValue)(normalizeLog_1.normalizeLog),
    queueLogs: (0, awilix_1.asValue)(bull_1.queueLogs),
});
