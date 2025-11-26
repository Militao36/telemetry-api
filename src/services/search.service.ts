import { Cacheable } from '../decorators/Cacheable';
import { QueriesRepository } from '../repositories/queries.repository';
import { RequestsRepository } from '../repositories/requests.repository';

export interface SearchFilters {
  type: 'HTTP' | 'DATABASE' | 'CACHE';
  httpFilter: {
    method?: string;
    statusCode?: number;
    pathContains?: string;
  };

  databaseFilter: {
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

  @Cacheable({ ttl: 60 })
  public async list(idEmpresa: string, qs: SearchFilters) {
    if (qs.type === 'HTTP') {
      return this.requestsRepository.list(idEmpresa, qs);
    }

    if (qs.type === 'DATABASE') {
      return this.queriesRepository.list(idEmpresa, qs);
    }

    return [];
  }
}
