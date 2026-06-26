import { Queue } from 'bull';
import { RedisClientType } from '@redis/client';
import { Logger } from 'pino';

import { LIMIT_ITEM_QUEUE_DEFAULT } from '../env';
import { ADD_LOG_SCRIPT } from '../databases/redis/lua/log';
import { NormalizedLog, RawLog, ResourceLog } from '../queues/bull/utils/normalizeLog';
import { LogsRepository } from '../repositories/logs.repository';
import { CompanyService } from './company.service';
import { CompanyStatus } from '../entities/company.entity';
import { Cacheable } from '../decorators/Cacheable';

export class LogService {
  queueLogs: Queue;
  normalizeLog: (idProject: string, idEmpresa: string, logs: RawLog[] | ResourceLog[], redactionFields?: string[]) => Array<NormalizedLog>;
  clientRedis: RedisClientType;
  logger: Logger;
  LIMIT_ITEM_QUEUE: number;
  logsRepository: LogsRepository;
  companyService: CompanyService;

  constructor({ queueLogs, logger, logsRepository, clientRedis, normalizeLog, companyService }) {
    this.queueLogs = queueLogs;
    this.normalizeLog = normalizeLog;
    this.clientRedis = clientRedis;
    this.LIMIT_ITEM_QUEUE = LIMIT_ITEM_QUEUE_DEFAULT;
    this.logger = logger;
    this.logsRepository = logsRepository;
    this.companyService = companyService;
  }

  async create(idEmpresa: string, idProject: string, logsRaw: Array<Record<string, any>>, redactionFields: string[] = []) {
    const logs = this.normalizeLog(idProject, idEmpresa, logsRaw as any, redactionFields);

    await this.companyService.resetCountRegisters(idEmpresa);
    const company = await this.companyService.findById(idEmpresa);

    if (company.status === CompanyStatus.INACTIVE) {
      this.logger.warn(`Company ${idEmpresa} is inactive. Skipping trace processing.`);
      return;
    }

    const countLogs = logs.length;

    await this.companyService.incrementCountRegisters(idEmpresa, countLogs);

    if (countLogs === 0) {
      return;
    }

    const countKey = `log_count:${idEmpresa}:${idProject}`;
    const logsKey = `log_logs:${idEmpresa}:${idProject}`;

    try {
      const result = (await this.clientRedis.eval(ADD_LOG_SCRIPT, {
        keys: [countKey, logsKey],
        arguments: [this.LIMIT_ITEM_QUEUE.toString(), JSON.stringify(logs), logs.length.toString()],
      })) as [number, string];

      const [shouldQueue, logsToQueue] = result;

      if (shouldQueue === 1 && logsToQueue) {
        const parsedLogs = JSON.parse(logsToQueue);

        if (parsedLogs.length > 0) {
          await this.queueLogs.add(
            {
              idEmpresa,
              idProject,
              logs: parsedLogs,
            },
            {
              removeOnComplete: true,
              removeOnFail: 1000,
            },
          );
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

  async findOne(idEmpresa: string, idProject: string, traceId: string, spanId: string, qs: Record<string, any>) {
    return await this.logsRepository.findOne(idEmpresa, idProject, traceId, spanId, qs);
  }
}
