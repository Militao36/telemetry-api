"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.container = void 0;
const trace_service_1 = require("./services/trace.service");
const awilix_1 = require("awilix");
const axios_1 = __importDefault(require("axios"));
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
const requests_repository_1 = require("./repositories/requests.repository");
const requests_service_1 = require("./services/requests.service");
const knex_1 = require("./databases/knex");
const project_service_1 = require("./services/project.service");
const user_service_1 = require("./services/user.service");
const user_repository_1 = require("./repositories/user.repository");
const projects_repository_1 = require("./repositories/projects.repository");
const hash_service_1 = require("./services/hash.service");
const search_service_1 = require("./services/search.service");
const log_service_1 = require("./services/log.service");
const logs_repository_1 = require("./repositories/logs.repository");
const company_service_1 = require("./services/company.service");
const company_repository_1 = require("./repositories/company.repository");
const container = (0, awilix_1.createContainer)();
exports.container = container;
container.register({
    logger: (0, awilix_1.asValue)(logger_1.logger),
    hashService: (0, awilix_1.asClass)(hash_service_1.HashService).singleton(),
    axios: (0, awilix_1.asValue)(axios_1.default),
    clickHouseClient: (0, awilix_1.asValue)(clickhouse_1.clientClickHouse),
    clientRedis: (0, awilix_1.asValue)(redis_1.clientRedis),
    databaseKnex: (0, awilix_1.asValue)(knex_1.databaseKnex),
    traceService: (0, awilix_1.asClass)(trace_service_1.TracesService).singleton(),
    dashService: (0, awilix_1.asClass)(dash_service_1.DashService).singleton(),
    queriesService: (0, awilix_1.asClass)(queries_service_1.QueriesService).singleton(),
    requestsService: (0, awilix_1.asClass)(requests_service_1.RequestsService).singleton(),
    projectService: (0, awilix_1.asClass)(project_service_1.ProjectService).singleton(),
    userService: (0, awilix_1.asClass)(user_service_1.UserService).singleton(),
    searchService: (0, awilix_1.asClass)(search_service_1.SearchService).singleton(),
    logService: (0, awilix_1.asClass)(log_service_1.LogService).singleton(),
    companyService: (0, awilix_1.asClass)(company_service_1.CompanyService).singleton(),
    dashRepository: (0, awilix_1.asClass)(dash_repository_1.DashRepository).singleton(),
    queriesRepository: (0, awilix_1.asClass)(queries_repository_1.QueriesRepository).singleton(),
    requestsRepository: (0, awilix_1.asClass)(requests_repository_1.RequestsRepository).singleton(),
    userRepository: (0, awilix_1.asClass)(user_repository_1.UserRepository).singleton(),
    projectsRepository: (0, awilix_1.asClass)(projects_repository_1.ProjectsRepository).singleton(),
    logsRepository: (0, awilix_1.asClass)(logs_repository_1.LogsRepository).singleton(),
    companyRepository: (0, awilix_1.asClass)(company_repository_1.CompanyRepository).singleton(),
    traceJobProcessor: (0, awilix_1.asClass)(traces_1.TraceJobProcessor).singleton(),
    queueTraces: (0, awilix_1.asValue)(bull_1.queueTraces),
    normalizeOTLP: (0, awilix_1.asValue)(normalizeOtlpHttpJsonTrace_1.normalizeOTLP),
    normalizeLog: (0, awilix_1.asValue)(normalizeLog_1.normalizeLog),
    queueLogs: (0, awilix_1.asValue)(bull_1.queueLogs),
});
