"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TracesService = void 0;
class TracesService {
    constructor({ queueTraces, logger, clientRedis, normalizeOTLP }) {
        this.LIMIT_SPANS_QUEUE = 1000;
        this.queueTraces = queueTraces;
        this.normalizeOTLP = normalizeOTLP;
        this.clientRedis = clientRedis;
        this.LIMIT_SPANS_QUEUE = 1000;
    }
    async create(idEmpresa, resourceSpans) {
        this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans`);
        const spans = this.normalizeOTLP(resourceSpans);
        const redisKey = `trace_count:${idEmpresa}`;
        const listSpans = await this.clientRedis.incr(redisKey);
        if (listSpans >= this.LIMIT_SPANS_QUEUE) {
            this.logger.info(`Limit of ${this.LIMIT_SPANS_QUEUE} spans reached for company ${idEmpresa}, sending to queue`);
            const spansToQueue = await this.clientRedis.get(`trace_spans:${idEmpresa}`);
            let parsedSpans = [];
            if (spansToQueue) {
                parsedSpans = JSON.parse(spansToQueue);
            }
            if (parsedSpans.length > 0) {
                await this.queueTraces.add({
                    idEmpresa,
                    spans: parsedSpans,
                });
            }
        }
        this.logger.info(`Storing ${spans.length} spans for company ${idEmpresa} in Redis`);
        const existingSpans = await this.clientRedis.get(`trace_spans:${idEmpresa}`);
        let spansArray = [];
        if (existingSpans) {
            spansArray = JSON.parse(existingSpans);
        }
        spansArray = spansArray.concat(spans);
        await this.clientRedis.set(`trace_spans:${idEmpresa}`, JSON.stringify(spansArray));
        this.logger.info(`Stored ${spansArray.length} spans for company ${idEmpresa} in Redis`);
    }
}
exports.TracesService = TracesService;
