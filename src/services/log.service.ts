import { Queue } from 'bull';
import { RedisClientType } from '@redis/client';
import { Logger } from 'pino';

import { LIMIT_ITEM_QUEUE_DEFAULT } from '../env';
import { ADD_LOG_SCRIPT } from '../databases/redis/lua/log';
import { NormalizedLog, RawLog, ResourceLog } from '../queues/bull/utils/normalizeLog';
import { LogsRepository } from '../repositories/logs.repository';

export class LogService {
  queueLogs: Queue;
  normalizeLog: (idProject: string, idEmpresa: string, logs: RawLog[] | ResourceLog[]) => Array<NormalizedLog>;
  clientRedis: RedisClientType;
  logger: Logger;
  LIMIT_ITEM_QUEUE: number;
  logsRepository: LogsRepository

  constructor({ queueLogs, logger, logsRepository, clientRedis, normalizeLog }) {
    this.queueLogs = queueLogs;
    this.normalizeLog = normalizeLog;
    this.clientRedis = clientRedis;
    this.LIMIT_ITEM_QUEUE = LIMIT_ITEM_QUEUE_DEFAULT;
    this.logger = logger;
    this.logsRepository = logsRepository;
  }

  async create(idEmpresa: string, idProject: string, logsRaw: Array<Record<string, any>>) {
    const logs = this.normalizeLog(idProject, idEmpresa, logsRaw as any);

    if (logs.length === 0) {
      return;
    }

    const countKey = `log_count:${idEmpresa}`;
    const logsKey = `log_logs:${idEmpresa}`;

    try {
      const result = (await this.clientRedis.eval(ADD_LOG_SCRIPT, {
        keys: [countKey, logsKey],
        arguments: ['10', JSON.stringify(logs), logs.length.toString()],
      })) as [number, string];

      const [shouldQueue, logsToQueue] = result;

      if (shouldQueue === 1 && logsToQueue) {
        const parsedLogs = JSON.parse(logsToQueue);

        if (parsedLogs.length > 0) {
          await this.queueLogs.add({
            idEmpresa,
            idProject,
            logs: parsedLogs,
          });
        }
      }
    } catch (error) {
      this.logger.error(`Error processing logs for company ${idEmpresa}: ${error}`);
      throw error;
    }
  }

  async list(idEmpresa: string, idProject: string, qs: Record<string, any>) {
    return await this.logsRepository.list(idEmpresa, idProject, qs);
  }
}
