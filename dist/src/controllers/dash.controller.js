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
    constructor({ dashService, clientRedis }) {
        this.dashService = dashService;
        this.clientRedis = clientRedis;
    }
    async reportRequests(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { hour = '12' } = request.query;
        const data = await this.dashService.reportRequests(idEmpresa, +hour);
        return response.status(200).json(data);
    }
};
exports.DashController = DashController;
__decorate([
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], DashController.prototype, "reportRequests", null);
exports.DashController = DashController = __decorate([
    (0, awilix_express_1.route)('/dashboard'),
    __metadata("design:paramtypes", [Object])
], DashController);
