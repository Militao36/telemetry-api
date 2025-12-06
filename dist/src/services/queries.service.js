"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueriesService = void 0;
const lodash_1 = require("lodash");
const Cacheable_1 = require("../decorators/Cacheable");
class QueriesService {
    constructor({ queriesRepository }) {
        this.queriesRepository = queriesRepository;
    }
    async reportQueries(idEmpresa, idProject, hour, queryType) {
        const averageTime = await this.queriesRepository.avgQueryTimeByType(idEmpresa, idProject, hour, queryType);
        const slowesTypeSelect = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'select', 10);
        const slowesTypeInsert = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'insert', 10);
        const slowesTypeUpdate = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'update', 10);
        const slowesTypeDelete = await this.queriesRepository.slowestQueries(idEmpresa, idProject, hour, 'del', 10);
        const slowestQuery = (0, lodash_1.orderBy)([slowesTypeSelect[0], slowesTypeInsert[0], slowesTypeUpdate[0], slowesTypeDelete[0]].filter((e) => !!e), ['durationMs'], ['desc']).slice(0, 1);
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
    async dashboardQueries(idEmpresa, idProject, hour) {
        const queriesPerTimeSeries = await this.queriesRepository.getQueriesPerTimeSeries(idEmpresa, idProject, hour);
        return {
            queriesPerTimeSeries,
        };
    }
    async getTraces(idEmpresa, idProject, traceId) {
        const traces = await this.queriesRepository.getTraces(idEmpresa, idProject, traceId);
        return traces;
    }
}
exports.QueriesService = QueriesService;
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], QueriesService.prototype, "reportQueries", null);
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], QueriesService.prototype, "dashboardQueries", null);
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], QueriesService.prototype, "getTraces", null);
