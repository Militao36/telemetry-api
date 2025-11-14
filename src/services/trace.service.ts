import { Queue } from "bull";
import { RedisClientType } from "@redis/client";
import { Logger } from "pino";

import { NormalizedSpanDatabase, NormalizedSpanHttp } from "../queues/bull/utils/normalizeOtlpHttpJsonTrace";
import { LIMIT_ITEM_QUEUE_DEFAULT } from "../env";
import { ADD_ITEM_SCRIPT } from "../databases/redis/lua";

export class TracesService {
  queueTraces: Queue
  normalizeOTLP: (resourceSpans: any[]) => {
    spans_http: Partial<NormalizedSpanHttp>[];
    spans_database: Partial<NormalizedSpanDatabase>[];
  }
  clientRedis: RedisClientType
  logger: Logger
  LIMIT_ITEM_QUEUE_DEFAULT: number

  constructor({ queueTraces, logger, clientRedis, normalizeOTLP }) {
    this.queueTraces = queueTraces
    this.normalizeOTLP = normalizeOTLP
    this.clientRedis = clientRedis
    this.LIMIT_ITEM_QUEUE_DEFAULT = LIMIT_ITEM_QUEUE_DEFAULT
    this.logger = logger
  }

  async create(idEmpresa: string, resourceSpans: Array<Record<string, any>>) {
    this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans`);

    const spans = this.normalizeOTLP(resourceSpans);

    if (spans?.spans_database?.length === 0 && spans?.spans_http?.length === 0) {
      this.logger.info(`No spans to process for company ${idEmpresa}`);
      return;
    }

    const countKey = `trace_count:${idEmpresa}`;
    const spansKey = `trace_spans:${idEmpresa}`;

    const length = ((spans.spans_database.length || 0) + (spans?.spans_http?.length || 0))

    try {
      const result = await this.clientRedis.eval(
        ADD_ITEM_SCRIPT,
        {
          keys: [countKey, spansKey],
          arguments: [
            this.LIMIT_ITEM_QUEUE_DEFAULT.toString(),
            JSON.stringify(spans),
            length.toString()
          ]
        }
      ) as [number, string];

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

    } catch (error) {
      this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
      throw error;
    }
  }
}
