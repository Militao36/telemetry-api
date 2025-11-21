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
        const idEmpresa = request.idEmpresa
        const { resourceSpans } = request.body;
        await this.traceService.create(idEmpresa, request.idProject, resourceSpans);
        return response.status(200).json({});
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
exports.TraceController = TraceController = __decorate([
    (0, awilix_express_1.route)('/logs'),
    __metadata("design:paramtypes", [Object])
], TraceController);
