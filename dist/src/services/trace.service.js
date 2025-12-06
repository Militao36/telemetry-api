"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracesService = void 0;
const lodash_1 = __importDefault(require("lodash"));
const env_1 = require("../env");
const lua_1 = require("../databases/redis/lua");
class TracesService {
    constructor({ queriesService, requestsService, companyService, queueTraces, logger, clientRedis, normalizeOTLP }) {
        this.queueTraces = queueTraces;
        this.normalizeOTLP = normalizeOTLP;
        this.clientRedis = clientRedis;
        this.LIMIT_ITEM_QUEUE_DEFAULT = env_1.LIMIT_ITEM_QUEUE_DEFAULT;
        this.logger = logger;
        this.queriesService = queriesService;
        this.requestsService = requestsService;
        this.companyService = companyService;
    }
    async create(idEmpresa, idProject, resourceSpans) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j;
        this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans, for project ${idProject}`);
        const spans = this.normalizeOTLP(idEmpresa, idProject, resourceSpans);
        const company = await this.companyService.findById(idEmpresa);
        const countSpans = (spans.spans_database.length || 0) + (((_a = spans === null || spans === void 0 ? void 0 : spans.spans_http) === null || _a === void 0 ? void 0 : _a.length) || 0);
        if ((company.countRegisters + countSpans) > company.limitRegisters) {
            this.logger.warn(`Company has exceeded the limit of registers: ${company.countRegisters}/${company.limitRegisters}`);
            return;
        }
        await this.companyService.incrementCountRegisters(idEmpresa, (spans.spans_database.length || 0) + (((_b = spans === null || spans === void 0 ? void 0 : spans.spans_http) === null || _b === void 0 ? void 0 : _b.length) || 0));
        if (((_c = spans === null || spans === void 0 ? void 0 : spans.spans_database) === null || _c === void 0 ? void 0 : _c.length) === 0 && ((_d = spans === null || spans === void 0 ? void 0 : spans.spans_http) === null || _d === void 0 ? void 0 : _d.length) === 0) {
            this.logger.info(`No spans to process for company ${idEmpresa}`);
            return;
        }
        const countKey = `trace_count:${idEmpresa}`;
        const spansKey = `trace_spans:${idEmpresa}`;
        const length = (spans.spans_database.length || 0) + (((_e = spans === null || spans === void 0 ? void 0 : spans.spans_http) === null || _e === void 0 ? void 0 : _e.length) || 0);
        try {
            const result = (await this.clientRedis.eval(lua_1.ADD_ITEM_SCRIPT, {
                keys: [countKey, spansKey],
                arguments: [this.LIMIT_ITEM_QUEUE_DEFAULT.toString(), JSON.stringify(spans), length.toString()],
            }));
            const [shouldQueue, spansToQueue] = result;
            if (shouldQueue === 1 && spansToQueue) {
                this.logger.info(`Limit of ${this.LIMIT_ITEM_QUEUE_DEFAULT} spans reached for company ${idEmpresa}, sending to queue`);
                const parsedSpans = JSON.parse(spansToQueue);
                const totalLen = (((_f = parsedSpans === null || parsedSpans === void 0 ? void 0 : parsedSpans.spans_database) === null || _f === void 0 ? void 0 : _f.length) || 0) + (((_g = parsedSpans === null || parsedSpans === void 0 ? void 0 : parsedSpans.spans_http) === null || _g === void 0 ? void 0 : _g.length) || 0);
                if (((_h = parsedSpans === null || parsedSpans === void 0 ? void 0 : parsedSpans.spans_database) === null || _h === void 0 ? void 0 : _h.length) || ((_j = parsedSpans === null || parsedSpans === void 0 ? void 0 : parsedSpans.spans_http) === null || _j === void 0 ? void 0 : _j.length)) {
                    await this.queueTraces.add({
                        idEmpresa,
                        spans_database: parsedSpans.spans_database,
                        spans_http: parsedSpans.spans_http,
                    }, {
                        removeOnComplete: true,
                    });
                    this.logger.info(`Sent ${totalLen} spans to queue for company ${idEmpresa}`);
                }
            }
            this.logger.info(`Successfully processed ${length} spans for company ${idEmpresa}`);
        }
        catch (error) {
            this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
            throw error;
        }
    }
    async getTraces(idEmpresa, idProject, traceId) {
        const tracesQueries = await this.queriesService.getTraces(idEmpresa, idProject, traceId);
        const tracesRequests = await this.requestsService.getTraces(idEmpresa, idProject, traceId);
        const tracesQueriesOrdered = lodash_1.default.orderBy(tracesQueries, ['startTime'], ['asc']);
        const tracesRequestsOrdered = lodash_1.default.orderBy(tracesRequests, ['startTime'], ['asc']);
        const unionTraces = lodash_1.default.sortBy([...tracesQueriesOrdered.map((e) => (Object.assign(Object.assign({}, e), { typeTrace: 'query' }))), ...tracesRequestsOrdered.map((e) => (Object.assign(Object.assign({}, e), { typeTrace: 'request' })))], ['startTime']);
        return unionTraces;
    }
}
exports.TracesService = TracesService;
