import { QueriesRepository } from "../repositories/queries.repository";

export class QueriesService {
  queriesRepository: QueriesRepository;

  constructor({ queriesRepository }) {
    this.queriesRepository = queriesRepository;
  }

  public async reportQueries(idEmpresa: string, hour: number, queryType: 'select' | 'insert' | 'update' | 'delete' | 'all') {
    const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, hour, queryType);
    const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'select', 10);
    const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'insert', 10);
    // como eu passo all ele pesquisa dentro todas as queries, e o limit 1 ele pega apenas a primeira, dessa forma eu pego a mais lenta com limit 1
    const slowestQuery = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'all', 1);
    const queryVolumeByType = await this.queriesRepository.queryVolumeByType(idEmpresa, hour);
    const queryVolumeByHours = await this.queriesRepository.getQueryVolumeByHours(idEmpresa, hour);

    return {
      metrics: averageTime,
      slowesTypeSelect,
      slowesTypeInsert,
      queryVolumeByType,
      queryVolumeByHours,
      slowestQuery
    }
  }

  public async dashboardQueries(idEmpresa: string, hour: number) {
    const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, hour);

    return {
      queriesPerTimeSeries
    }
  }
}