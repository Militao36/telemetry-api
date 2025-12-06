import { orderBy } from 'lodash';
import { QueriesRepository } from '../repositories/queries.repository';
import { Cacheable } from '../decorators/Cacheable';

export class QueriesService {
  queriesRepository: QueriesRepository;

  constructor({ queriesRepository }) {
    this.queriesRepository = queriesRepository;
  }

  @Cacheable({ ttl: 60 })
  public async reportQueries(idEmpresa: string, idProject: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'del' | 'all') {
    const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, idProject, hour, queryType);

    const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'select', 10);
    const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'insert', 10);
    const slowesTypeUpdate = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'update', 10);
    const slowesTypeDelete = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'del', 10);

    const slowestQuery = orderBy(
      [slowesTypeSelect[0], slowesTypeInsert[0], slowesTypeUpdate[0], slowesTypeDelete[0]].filter((e) => !!e),
      ['durationMs'],
      ['desc'],
    ).slice(0, 1);

    const queryVolumeByType = await this.queriesRepository.queryVolumeByType(idEmpresa, idProject, hour);
    const queryVolumeByHours = await this.queriesRepository.getQueryVolumeByHours(idEmpresa, idProject, hour);
    const avgQueryTimeByHour = await this.queriesRepository.avgQueryTimeByHour(idEmpresa, idProject, hour, queryType);

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
    const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, idProject, hour);

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
