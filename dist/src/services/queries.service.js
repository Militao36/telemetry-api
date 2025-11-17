"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueriesService = void 0;
class QueriesService {
    constructor({ queriesRepository }) {
        this.queriesRepository = queriesRepository;
    }
    async reportQueries(idEmpresa, hour, queryType) {
        const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, hour, queryType);
        const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'select', 10);
        const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, hour, 'insert', 10);
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
        };
    }
    async dashboardQueries(idEmpresa, hour) {
        const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, hour);
        return {
            queriesPerTimeSeries
        };
    }
}
exports.QueriesService = QueriesService;
