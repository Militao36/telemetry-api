import { QueriesRepository } from '../repositories/queries.repository';

export class QueriesService {
  queriesRepository: QueriesRepository;

  constructor({ queriesRepository }) {
    this.queriesRepository = queriesRepository;
  }

  public async reportQueries(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all') {
    const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, hour, queryType);
    const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'select', 10);
    const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'insert', 10);
    const slowesTypeUpdate = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'update', 10);
    const slowesTypeDelete = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'delete', 10);
    const slowestQuery = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'all', 1);
    const queryVolumeByType = await this.queriesRepository.queryVolumeByType(idEmpresa, hour);
    const queryVolumeByHours = await this.queriesRepository.getQueryVolumeByHours(idEmpresa, hour);
    const avgQueryTimeByHour = await this.queriesRepository.avgQueryTimeByHour(idEmpresa, hour, queryType);

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

  public async dashboardQueries(idEmpresa: string, hour: number) {
    const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, hour);

    return {
      queriesPerTimeSeries,
    };
  }

  public async getTraces(idEmpresa: string, traceId: string) {
    const traces = await this.queriesRepository.getTraces(idEmpresa, traceId);

    return traces;
  }
}
