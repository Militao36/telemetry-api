import { QueriesRepository } from "../repositories/queries.repository";

export class QueriesService {
  queriesRepository: QueriesRepository;

  constructor({ queriesRepository }) {
    this.queriesRepository = queriesRepository;
  }

  public async reportQueries(idEmpresa: string, hour: number, queryTy: 'select' | 'insert' | 'update' | 'delete' | 'all') {
    const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, hour, queryTy);
    const slowesTypeTSelect = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'select', 10);
    const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'insert', 10);
    const queryVolumeByType = await this.queriesRepository.queryVolumeByType(idEmpresa, hour);
    const queryVolumeByFourHours = await this.queriesRepository.getQueryVolumeByFourHours(idEmpresa);

    return {
      metrics: averageTime,
      slowesTypeTSelect,
      slowesTypeInsert,
      queryVolumeByType,
      queryVolumeByFourHours
    }
  }
}