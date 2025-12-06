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
exports.RequestsService = void 0;
const Cacheable_1 = require("../decorators/Cacheable");
class RequestsService {
    constructor({ requestsRepository, dashRepository }) {
        this.requestsRepository = requestsRepository;
        this.dashRepository = dashRepository;
    }
    async recentRequests(idEmpresa, idProject, hour, httpMethod) {
        const requests = await this.requestsRepository.recentRequests(idEmpresa, idProject, hour, httpMethod);
        return requests;
    }
    async getSlowestRequests(idEmpresa, idProject, hour, httpMethod) {
        const requests = await this.requestsRepository.getSlowestRequests(idEmpresa, idProject, hour, httpMethod);
        return requests;
    }
    async getMetrics(idEmpresa, idProject, hour = 1, httpMethod = 'ALL') {
        const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, idProject, hour, httpMethod);
        const responseStatusDistribution = await this.requestsRepository.getResponseStatusDistribution(idEmpresa, hour, httpMethod);
        return {
            requestPerTimeSeries,
            responseStatusDistribution,
        };
    }
    async getTraces(idEmpresa, idProject, traceId) {
        const traces = await this.requestsRepository.getTraces(idEmpresa, idProject, traceId);
        return traces;
    }
}
exports.RequestsService = RequestsService;
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], RequestsService.prototype, "recentRequests", null);
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], RequestsService.prototype, "getSlowestRequests", null);
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number, String]),
    __metadata("design:returntype", Promise)
], RequestsService.prototype, "getMetrics", null);
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], RequestsService.prototype, "getTraces", null);
