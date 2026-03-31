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
exports.DashController = void 0;
const awilix_express_1 = require("awilix-express");
let DashController = class DashController {
    constructor({ queriesService, clientRedis }) {
        this.queriesService = queriesService;
        this.clientRedis = clientRedis;
    }
    async reportQueries(request, response) {
        const idEmpresa = request.idEmpresa;
        const { hour, queryTy } = request.query;
        const data = await this.queriesService.reportQueries(idEmpresa, request.idProject, +(hour || 720), queryTy);
        return response.status(200).json(data);
    }
    async dashboardQueries(request, response) {
        const idEmpresa = request.idEmpresa;
        const { hour } = request.query;
        const data = await this.queriesService.dashboardQueries(idEmpresa, request.idProject, +(hour || '12'));
        return response.status(200).json(data);
    }
    async getTraces(request, response) {
        const idEmpresa = request.idEmpresa;
        const { traceId } = request.params;
        const data = await this.queriesService.getTraces(idEmpresa, request.idProject, traceId);
        return response.status(200).json(data);
    }
};
exports.DashController = DashController;
__decorate([
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DashController.prototype, "reportQueries", null);
__decorate([
    (0, awilix_express_1.route)('/dashboard'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DashController.prototype, "dashboardQueries", null);
__decorate([
    (0, awilix_express_1.route)('/traces/:traceId'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DashController.prototype, "getTraces", null);
exports.DashController = DashController = __decorate([
    (0, awilix_express_1.route)('/queries'),
    __metadata("design:paramtypes", [Object])
], DashController);
