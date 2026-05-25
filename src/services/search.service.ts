import { Cacheable } from '../decorators/Cacheable';
import { QueriesRepository } from '../repositories/queries.repository';
import { RequestsRepository } from '../repositories/requests.repository';
import { clampInt, optionalClampInt, truncateString } from '../utils/queryParams';

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
        method: truncateString(qs.httpFilter?.method || qs.method, 16)?.toUpperCase(),
        statusCode: optionalClampInt(qs.httpFilter?.statusCode || qs.statusCode, 100, 599),
        pathContains: truncateString(qs.httpFilter?.pathContains || qs.pathContains || qs.q, 250),
      },
      databaseFilter: {
        queryContains: truncateString(qs.databaseFilter?.queryContains || qs.queryContains, 500),
        tableName: truncateString(qs.databaseFilter?.tableName || qs.tableName, 128),
      },
      limit: clampInt(qs.limit, 20, 1, 200),
      offset: clampInt(qs.offset, 0, 0, 10000),
      environment: truncateString(qs.environment, 128),
      traceId: truncateString(qs.traceId, 128),
      startTimeFrom: truncateString(qs.startTimeFrom, 64),
      startTimeTo: truncateString(qs.startTimeTo, 64),
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
