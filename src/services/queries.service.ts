import { QueriesRepository } from "../repositories/queries.repository";

export class QueriesService {
  queriesRepository: QueriesRepository;

  constructor({ queriesRepository }) {
    this.queriesRepository = queriesRepository;
  }

  public async reportQueries(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all') {
    const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, hour, queryType);
    const slowestQuery = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'all', 1);
    const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'select', 10);
    const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'insert', 10);
    const slowesTypeUpdate = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'update', 10);
    const slowesTypeDelete = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'delete', 10);
    const queryVolumeByType = await this.queriesRepository.queryVolumeByType(idEmpresa, hour);
    const queryVolumeByHours = await this.queriesRepository.getQueryVolumeByFourHours(idEmpresa);
    const avgQueryTimeByHour = await this.queriesRepository.avgQueryTimeByType(idEmpresa, hour, queryType);
    
    return {
      metrics: averageTime,
      slowesTypeSelect,
      slowesTypeInsert,
      slowesTypeUpdate,
      slowesTypeDelete,
      slowestQuery,
      queryVolumeByType,
      queryVolumeByHours,
      avgQueryTimeByHour,
    }
  }

  public async dashboardQueries(idEmpresa: string, hour: number) {
    const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, hour);

    return {
      queriesPerTimeSeries
    }
  }
}