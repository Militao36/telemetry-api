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
        this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans`);
        const spans = this.normalizeOTLP(resourceSpans);
        if (spans.length === 0) {
            this.logger.info(`No spans to process for company ${idEmpresa}`);
            return;
        }
        const countKey = `trace_count:${idEmpresa}`;
        const spansKey = `trace_spans:${idEmpresa}`;
        try {
            const result = await this.clientRedis.eval(lua_1.ADD_ITEM_SCRIPT, {
                keys: [countKey, spansKey],
                arguments: [
                    this.LIMIT_ITEM_QUEUE_DEFAULT.toString(),
                    JSON.stringify(spans),
                    spans.length.toString()
                ]
            });
            const [shouldQueue, spansToQueue] = result;
            if (shouldQueue === 1 && spansToQueue) {
                this.logger.info(`Limit of ${this.LIMIT_ITEM_QUEUE_DEFAULT} spans reached for company ${idEmpresa}, sending to queue`);
                const parsedSpans = JSON.parse(spansToQueue);
                if (parsedSpans.length > 0) {
                    await this.queueTraces.add({
                        idEmpresa,
                        spans: parsedSpans,
                    });
                    this.logger.info(`Sent ${parsedSpans.length} spans to queue for company ${idEmpresa}`);
                }
            }
            this.logger.info(`Successfully processed ${spans.length} spans for company ${idEmpresa}`);
        }
        catch (error) {
            this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
            throw error;
        }
    }
}
exports.TracesService = TracesService;
