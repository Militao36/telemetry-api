import { Cacheable } from '../decorators/Cacheable';
import { QueriesRepository } from '../repositories/queries.repository';
import { RequestsRepository } from '../repositories/requests.repository';

export interface SearchFilters {
  type: 'HTTP' | 'DATABASE' | 'CACHE';
  method?: string;
  statusCode?: number;
  pathContains?: string;
  q?: string;
  queryContains?: string;
  tableName?: string;
  httpFilter?: {
    method?: string;
    statusCode?: number;
    pathContains?: string;
  };

  databaseFilter?: {
    queryContains?: string;
    tableName?: string;
  };

  environment?: string;
  startTimeFrom?: string;
  startTimeTo?: string;
  traceId?: string;
  limit?: number;
  offset?: number;
}

export class SearchService {
  requestsRepository: RequestsRepository;
  queriesRepository: QueriesRepository;

  constructor({ requestsRepository, queriesRepository }) {
    this.requestsRepository = requestsRepository;
    this.queriesRepository = queriesRepository;
  }

  public async list(idEmpresa: string, idProject: string, qs: SearchFilters) {
    const normalizedFilters: SearchFilters = {
      ...qs,
      type: qs.type,
      httpFilter: {
        method: qs.httpFilter?.method || qs.method,
        statusCode: qs.httpFilter?.statusCode || qs.statusCode,
        pathContains: qs.httpFilter?.pathContains || qs.pathContains || qs.q,
      },
      databaseFilter: {
        queryContains: qs.databaseFilter?.queryContains || qs.queryContains,
        tableName: qs.databaseFilter?.tableName || qs.tableName,
      },
      limit: qs.limit,
      offset: qs.offset,
      environment: qs.environment,
      traceId: qs.traceId,
      startTimeFrom: qs.startTimeFrom,
      startTimeTo: qs.startTimeTo,
    };

    if (normalizedFilters.type === 'HTTP') {
      return this.requestsRepository.list(idEmpresa, idProject, normalizedFilters);
    }

    if (normalizedFilters.type === 'DATABASE') {
      return this.queriesRepository.list(idEmpresa, idProject, normalizedFilters);
    }

    return [];
  }
}
