import { Queue } from 'bull';
import { RedisClientType } from '@redis/client';
import { Logger } from 'pino';
import _ from 'lodash';

import { NormalizedSpanDatabase, NormalizedSpanHttp } from '../queues/bull/utils/normalizeOtlpHttpJsonTrace';
import { LIMIT_ITEM_QUEUE_DEFAULT } from '../env';
import { ADD_ITEM_SCRIPT } from '../databases/redis/lua';
import { QueriesRepository } from '../repositories/queries.repository';
import { QueriesService } from './queries.service';
import { RequestsService } from './requests.service';
import { UserService } from './user.service';
import { CompanyService } from './company.service';
import { CompanyStatus } from '../entities/company.entity';

export class TracesService {
  queueTraces: Queue;
  normalizeOTLP: (
    idEmpresa: string,
    idProject: string,
    resourceSpans: any[],
    redactionFields?: string[],
  ) => {
    spans_http: Partial<NormalizedSpanHttp>[];
    spans_database: Partial<NormalizedSpanDatabase>[];
  };
  clientRedis: RedisClientType;
  logger: Logger;
  LIMIT_ITEM_QUEUE_DEFAULT: number;
  queriesService: QueriesService;
  requestsService: RequestsService;
  userService: UserService;
  companyService: CompanyService;

  constructor({ queriesService, requestsService, companyService, queueTraces, logger, clientRedis, normalizeOTLP }) {
    this.queueTraces = queueTraces;
    this.normalizeOTLP = normalizeOTLP;
    this.clientRedis = clientRedis;
    this.LIMIT_ITEM_QUEUE_DEFAULT = LIMIT_ITEM_QUEUE_DEFAULT;
    this.logger = logger;
    this.queriesService = queriesService;
    this.requestsService = requestsService;
    this.companyService = companyService;
  }

  async create(idEmpresa: string, idProject: string, resourceSpans: Array<Record<string, any>>, redactionFields: string[] = []) {
    this.logger.info(`Creating traces for company ${idEmpresa} with ${resourceSpans.length} resourceSpans, for project ${idProject}`);

    const spans = this.normalizeOTLP(idEmpresa, idProject, resourceSpans, redactionFields);

    // muito importante resetar o countRegisters antes de incrementar se tiver passado um mês
    await this.companyService.resetCountRegisters(idEmpresa);
    const company = await this.companyService.findById(idEmpresa);

    if (company.status === CompanyStatus.INACTIVE) {
      this.logger.warn(`Company ${idEmpresa} is inactive. Skipping trace processing.`);
      return;
    }

    const countSpans = (spans.spans_database.length || 0) + (spans?.spans_http?.length || 0)

    await this.companyService.incrementCountRegisters(idEmpresa, countSpans);

    if (spans?.spans_database?.length === 0 && spans?.spans_http?.length === 0) {
      this.logger.info(`No spans to process for company ${idEmpresa}`);
      return;
    }

    const countKey = `trace_count:${idEmpresa}`;
    const spansKey = `trace_spans:${idEmpresa}`;

    const length = (spans.spans_database.length || 0) + (spans?.spans_http?.length || 0);

    try {
      const result = (await this.clientRedis.eval(ADD_ITEM_SCRIPT, {
        keys: [countKey, spansKey],
        arguments: [this.LIMIT_ITEM_QUEUE_DEFAULT.toString(), JSON.stringify(spans), length.toString()],
      })) as [number, string];

      const [shouldQueue, spansToQueue] = result;

      if (shouldQueue === 1 && spansToQueue) {
        this.logger.info(`Limit of ${this.LIMIT_ITEM_QUEUE_DEFAULT} spans reached for company ${idEmpresa}, sending to queue`);

        const parsedSpans = JSON.parse(spansToQueue);

        const totalLen = (parsedSpans?.spans_database?.length || 0) + (parsedSpans?.spans_http?.length || 0);
        if (parsedSpans?.spans_database?.length || parsedSpans?.spans_http?.length) {
          await this.queueTraces.add(
            {
              idEmpresa,
              spans_database: parsedSpans.spans_database,
              spans_http: parsedSpans.spans_http,
            },
            {
              removeOnComplete: true,
            },
          );

          this.logger.info(`Sent ${totalLen} spans to queue for company ${idEmpresa}`);
        }
      }

      this.logger.info(`Successfully processed ${length} spans for company ${idEmpresa}`);
    } catch (error) {
      this.logger.error(`Error processing spans for company ${idEmpresa}: ${error}`);
      throw error;
    }
  }

  public async getTraces(idEmpresa: string, idProject: string, traceId: string) {
    const tracesQueries = await this.queriesService.getTraces(idEmpresa, idProject, traceId);
    const tracesRequests = await this.requestsService.getTraces(idEmpresa, idProject, traceId);

    const tracesQueriesOrdered = _.orderBy(tracesQueries, ['startTime'], ['asc']);
    const tracesRequestsOrdered = _.orderBy(tracesRequests, ['startTime'], ['asc']);

    const unionTraces = _.sortBy(
      [...tracesQueriesOrdered.map((e) => ({ ...e, typeTrace: 'query' })), ...tracesRequestsOrdered.map((e) => ({ ...e, typeTrace: 'request' }))],
      ['startTime'],
    );

    return unionTraces;
  }
}
