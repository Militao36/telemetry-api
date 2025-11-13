import { Queue } from "bull";
import { RedisClientType } from "@redis/client";
import { Logger } from "pino";

import { NormalizedSpan } from "../queues/bull/utils/normalizeOtlpHttpJsonTrace";
import { LIMIT_SPANS_QUEUE_DEFAULT } from "../env";

export class TracesService {
  queueTraces: Queue
  normalizeOTLP: (resourceSpans: any[]) => Array<NormalizedSpan>
  clientRedis: RedisClientType
  logger: Logger

  LIMIT_SPANS_QUEUE: number

  constructor({ queueTraces, logger, clientRedis, normalizeOTLP }) {
    this.queueTraces = queueTraces
    this.normalizeOTLP = normalizeOTLP
    this.clientRedis = clientRedis
    this.LIMIT_SPANS_QUEUE = LIMIT_SPANS_QUEUE_DEFAULT
    this.logger = logger
  }

  async create(idEmpresa: string, resourceSpans: Array<Record<string, any>>) {
    this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans`);

    const spans = this.normalizeOTLP(resourceSpans);

    const redisKey = `trace_count:${idEmpresa}`;
    const listSpans = await this.clientRedis.incr(redisKey);

    if (listSpans >= this.LIMIT_SPANS_QUEUE) {
      this.logger.info(`Limit of ${this.LIMIT_SPANS_QUEUE} spans reached for company ${idEmpresa}, sending to queue`);

      const spansToQueue = await this.clientRedis.get(`trace_spans:${idEmpresa}`);
      let parsedSpans = [];

      if (spansToQueue) {
        parsedSpans = JSON.parse(spansToQueue as string);
      }

      if (parsedSpans.length > 0) {
        await this.clientRedis.del(`trace_spans:${idEmpresa}`);
        await this.clientRedis.set(redisKey, '0');
        
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
      spansArray = JSON.parse(existingSpans as string);
    }

    spansArray = spansArray.concat(spans);

    await this.clientRedis.set(`trace_spans:${idEmpresa}`, JSON.stringify(spansArray));

    await this.clientRedis.incrBy(redisKey, spans.length);

    this.logger.info(`Stored ${spansArray.length} spans for company ${idEmpresa} in Redis`);
  }
}
