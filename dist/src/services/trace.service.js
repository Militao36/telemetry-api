"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracesService = void 0;
const env_1 = require("../env");
const lua_1 = require("../databases/redis/lua");
class TracesService {
    constructor({ queueTraces, logger, clientRedis, normalizeOTLP }) {
        this.queueTraces = queueTraces;
        this.normalizeOTLP = normalizeOTLP;
        this.clientRedis = clientRedis;
        this.LIMIT_ITEM_QUEUE_DEFAULT = env_1.LIMIT_ITEM_QUEUE_DEFAULT;
        this.logger = logger;
    }
    async create(idEmpresa, resourceSpans) {
        var _a, _b, _c;
        this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans`);
        const spans = this.normalizeOTLP(resourceSpans);
        if (((_a = spans === null || spans === void 0 ? void 0 : spans.spans_database) === null || _a === void 0 ? void 0 : _a.length) === 0 && ((_b = spans === null || spans === void 0 ? void 0 : spans.spans_http) === null || _b === void 0 ? void 0 : _b.length) === 0) {
            this.logger.info(`No spans to process for company ${idEmpresa}`);
            return;
        }
        const countKey = `trace_count:${idEmpresa}`;
        const spansKey = `trace_spans:${idEmpresa}`;
        const length = ((spans.spans_database.length || 0) + (((_c = spans === null || spans === void 0 ? void 0 : spans.spans_http) === null || _c === void 0 ? void 0 : _c.length) || 0));
        try {
            const result = await this.clientRedis.eval(lua_1.ADD_ITEM_SCRIPT, {
                keys: [countKey, spansKey],
                arguments: [
                    this.LIMIT_ITEM_QUEUE_DEFAULT.toString(),
                    JSON.stringify(spans),
                    length.toString()
                ]
            });
            const [shouldQueue, spansToQueue] = result;
            if (shouldQueue === 1 && spansToQueue) {
                this.logger.info(`Limit of ${this.LIMIT_ITEM_QUEUE_DEFAULT} spans reached for company ${idEmpresa}, sending to queue`);
                const parsedSpans = JSON.parse(spansToQueue);
                if (parsedSpans.length > 0) {
                    await this.queueTraces.add({
                        idEmpresa,
                        spans_database: parsedSpans.spans_database,
                        spans_http: parsedSpans.spans_http
                    });
                    this.logger.info(`Sent ${parsedSpans.length} spans to queue for company ${idEmpresa}`);
                }
            }
            this.logger.info(`Successfully processed ${length} spans for company ${idEmpresa}`);
        }
        catch (error) {
            this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
            throw error;
        }
    }
}
exports.TracesService = TracesService;
