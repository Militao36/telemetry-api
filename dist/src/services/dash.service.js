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
exports.DashService = void 0;
const Cacheable_1 = require("../decorators/Cacheable");
class DashService {
    constructor({ dashRepository }) {
        this.dashRepository = dashRepository;
    }
    async reportRequests(idEmpresa, idProject, hour) {
        const { totalRequests, totalErrors, avgMs: avgResponse, p50Ms, p90Ms, p95Ms, p99Ms } = await this.dashRepository.getMetrics(idEmpresa, idProject, hour);
        const topRequests = await this.dashRepository.getTopRequests(idEmpresa, idProject, hour);
        const totalQueries = await this.dashRepository.getTotalQueries(idEmpresa, idProject, hour);
        const requestPerTimeSeries = await this.dashRepository.getRequestPerTimeSeries(idEmpresa, idProject, hour, 'ALL');
        const slowestRequests = await this.dashRepository.getSlowestRequests(idEmpresa, idProject, hour);
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
__decorate([
    (0, Cacheable_1.Cacheable)({ ttl: 60 * 5 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Number]),
    __metadata("design:returntype", Promise)
], DashService.prototype, "reportRequests", null);
