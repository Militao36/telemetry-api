import { orderBy } from 'lodash';
import { QueriesRepository, QUERY_TYPES, QueryType } from '../repositories/queries.repository';
import { Cacheable } from '../decorators/Cacheable';
import { clampInt } from '../utils/queryParams';

export class QueriesService {
  queriesRepository: QueriesRepository;

  constructor({ queriesRepository }) {
    this.queriesRepository = queriesRepository;
  }

  @Cacheable({ ttl: 60 })
  public async reportQueries(idEmpresa: string, idProject: string, hour: number, queryType: QueryType) {
    const safeHour = clampInt(hour, 720, 1, 720);
    const normalizedQueryType = String(queryType || 'all').toLowerCase() as QueryType;
    const safeQueryType = QUERY_TYPES.includes(normalizedQueryType) ? normalizedQueryType : 'all';

    const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, idProject, safeHour, safeQueryType);

    const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, idProject, safeHour, 'select', 10);
    const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, idProject, safeHour, 'insert', 10);
    const slowesTypeUpdate = await this.queriesRepository.slowestQueries(idEmpresa, idProject, safeHour, 'update', 10);
    const slowesTypeDelete = await this.queriesRepository.slowestQueries(idEmpresa, idProject, safeHour, 'delete', 10);

    const slowestQuery = orderBy(
      [slowesTypeSelect[0], slowesTypeInsert[0], slowesTypeUpdate[0], slowesTypeDelete[0]].filter((e) => !!e),
      ['durationMs'],
      ['desc'],
    ).slice(0, 1);

    const queryVolumeByType = await this.queriesRepository.queryVolumeByType(idEmpresa, idProject, safeHour);
    const queryVolumeByHours = await this.queriesRepository.getQueryVolumeByHours(idEmpresa, idProject, safeHour);
    const avgQueryTimeByHour = await this.queriesRepository.avgQueryTimeByHour(idEmpresa, idProject, safeHour, safeQueryType);

    return {
      metrics: averageTime,
      slowesTypeSelect,
      slowesTypeInsert,
      slowesTypeUpdate,
      slowesTypeDelete,
      queryVolumeByType,
      queryVolumeByHours,
      slowestQuery,
      avgQueryTimeByHour,
    };
  }

  @Cacheable({ ttl: 60 })
  public async dashboardQueries(idEmpresa: string, idProject: string, hour: number) {
    const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, idProject, clampInt(hour, 12, 1, 720));

    return {
      queriesPerTimeSeries,
    };
  }

  @Cacheable({ ttl: 60 })
  public async getTraces(idEmpresa: string, idProject: string, traceId: string) {
    const traces = await this.queriesRepository.getTraces(idEmpresa, idProject, traceId);

    return traces;
  }
}
