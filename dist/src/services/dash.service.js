"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashService = void 0;
class DashService {
    constructor({ dashRepository }) {
        this.dashRepository = dashRepository;
    }
    async reportRequests(idEmpresa, hour) {
        const { totalRequests, totalErrors, avgMs: avgResponse, p50Ms, p90Ms, p95Ms, p99Ms } = await this.dashRepository.getMetrics(idEmpresa, hour);
        const topRequests = await this.dashRepository.getTopRequests(idEmpresa, hour);
        const totalQueries = await this.dashRepository.getTotalQueries(idEmpresa, hour);
        const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, hour);
        const slowestRequests = await this.dashRepository.getSlowestRequests(idEmpresa, hour);
        return {
            totalRequests,
            totalErrors,
            avgResponse,
            p50Ms,
            p90Ms,
            p95Ms,
            p99Ms,
            topRequests,
            requestPerTimeSeries,
            slowestRequests,
            totalQueries,
        };
    }
}
exports.DashService = DashService;
