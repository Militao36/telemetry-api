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
exports.TraceController = void 0;
const awilix_express_1 = require("awilix-express");
let TraceController = class TraceController {
    constructor({ traceService }) {
        this.traceService = traceService;
    }
    async create(request, response) {
        const idEmpresa = request.idEmpresa;
        const { resourceSpans } = request.body;
        await this.traceService.create(idEmpresa, request.idProject, resourceSpans);
        return response.status(200).json({});
    }
    async getTraces(request, response) {
        const idEmpresa = request.idEmpresa;
        const { traceId } = request.params;
        const data = await this.traceService.getTraces(idEmpresa, request.idProject, traceId);
        return response.status(200).json(data);
    }
};
exports.TraceController = TraceController;
__decorate([
    (0, awilix_express_1.route)('/'),
    (0, awilix_express_1.POST)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TraceController.prototype, "create", null);
__decorate([
    (0, awilix_express_1.route)('/:traceId'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], TraceController.prototype, "getTraces", null);
exports.TraceController = TraceController = __decorate([
    (0, awilix_express_1.route)('/traces'),
    __metadata("design:paramtypes", [Object])
], TraceController);
