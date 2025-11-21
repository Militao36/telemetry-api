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
exports.RequestsController = void 0;
const awilix_express_1 = require("awilix-express");
let RequestsController = class RequestsController {
    constructor({ requestsService }) {
        this.requestsService = requestsService;
    }
    async recentRequests(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { httpMethod, hour } = request.query;
        const data = await this.requestsService.recentRequests(idEmpresa, +hour, httpMethod === null || httpMethod === void 0 ? void 0 : httpMethod.toUpperCase());
        return response.status(200).json(data);
    }
    async getSlowestRequests(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { httpMethod, hour } = request.query;
        const data = await this.requestsService.getSlowestRequests(idEmpresa, +hour, httpMethod === null || httpMethod === void 0 ? void 0 : httpMethod.toUpperCase());
        return response.status(200).json(data);
    }
    async getMetrics(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { httpMethod, hour } = request.query;
        const data = await this.requestsService.getMetrics(idEmpresa, +hour, httpMethod === null || httpMethod === void 0 ? void 0 : httpMethod.toUpperCase());
        return response.status(200).json(data);
    }
    async getTraces(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { traceId } = request.params;
        const data = await this.requestsService.getTraces(idEmpresa, traceId);
        return response.status(200).json(data);
    }
};
exports.RequestsController = RequestsController;
__decorate([
    (0, awilix_express_1.route)('/recent'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "recentRequests", null);
__decorate([
    (0, awilix_express_1.route)('/slowest'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getSlowestRequests", null);
__decorate([
    (0, awilix_express_1.route)('/metrics'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getMetrics", null);
__decorate([
    (0, awilix_express_1.route)('/traces/:traceId'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], RequestsController.prototype, "getTraces", null);
exports.RequestsController = RequestsController = __decorate([
    (0, awilix_express_1.route)('/requests'),
    __metadata("design:paramtypes", [Object])
], RequestsController);
