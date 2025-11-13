import { Queue } from "bull";
import { RedisClientType } from "@redis/client";
import { Logger } from "pino";

import { LIMIT_ITEM_QUEUE_DEFAULT } from "../env";
import { ADD_ITEM_SCRIPT } from "../databases/redis/lua";
import { NormalizedLog, RawLog } from "../queues/bull/utils/normalizeLog";

export class LogService {
  queueLogs: Queue
  normalizeLog: (logs: RawLog[]) => Array<NormalizedLog>
  clientRedis: RedisClientType
  logger: Logger
  LIMIT_ITEM_QUEUE: number

  constructor({ queueLogs, logger, clientRedis, normalizeLog }) {
    this.queueLogs = queueLogs
    this.normalizeLog = normalizeLog
    this.clientRedis = clientRedis
    this.LIMIT_ITEM_QUEUE = LIMIT_ITEM_QUEUE_DEFAULT
    this.logger = logger
  }

  async create(idEmpresa: string, logsRaw: Array<Record<string, any>>) {
    const logs = this.normalizeLog(logsRaw as any);

    if (logs.length === 0) {
      return;
    }

    const countKey = `log_count:${idEmpresa}`;
    const logsKey = `log_logs:${idEmpresa}`;

    try {
      const result = await this.clientRedis.eval(
        ADD_ITEM_SCRIPT,
        {
          keys: [countKey, logsKey],
          arguments: [
            this.LIMIT_ITEM_QUEUE.toString(),
            JSON.stringify(logs),
            logs.length.toString()
          ]
        }
      ) as [number, string];

      const [shouldQueue, logsToQueue] = result;

      if (shouldQueue === 1 && logsToQueue) {
        const parsedSpans = JSON.parse(logsToQueue);

        if (parsedSpans.length > 0) {
          await this.queueLogs.add({
            idEmpresa,
            spans: parsedSpans,
          });
        }
      }

    } catch (error) {
      this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
      throw error;
    }
  }
}
