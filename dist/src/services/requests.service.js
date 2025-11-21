"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestsService = void 0;
class RequestsService {
    constructor({ requestsRepository, dashRepository }) {
        this.requestsRepository = requestsRepository;
        this.dashRepository = dashRepository;
    }
    async recentRequests(idEmpresa, hour, httpMethod) {
        const requests = await this.requestsRepository.recentRequests(idEmpresa, hour, httpMethod);
        return requests;
    }
    async getSlowestRequests(idEmpresa, hour, httpMethod) {
        const requests = await this.requestsRepository.getSlowestRequests(idEmpresa, hour, httpMethod);
        return requests;
    }
    async getMetrics(idEmpresa, hour = 1, httpMethod = 'ALL') {
        const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, hour, httpMethod);
        const responseStatusDistribution = await this.requestsRepository.getResponseStatusDistribution(idEmpresa, hour, httpMethod);
        return {
            requestPerTimeSeries,
            responseStatusDistribution,
        };
    }
    async getTraces(idEmpresa, traceId) {
        const traces = await this.requestsRepository.getTraces(idEmpresa, traceId);
        return traces;
    }
}
exports.RequestsService = RequestsService;
