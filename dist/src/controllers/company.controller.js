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
exports.CompanyController = void 0;
const awilix_express_1 = require("awilix-express");
let CompanyController = class CompanyController {
    constructor({ companyService }) {
        this.companyService = companyService;
    }
    async generatePay(request, response) {
        const idEmpresa = request.idEmpresa;
        const { plan } = request.body;
        const qrcode = await this.companyService.generatePay(idEmpresa, plan);
        return response.status(200).json({ qrcode });
    }
    async findById(request, response) {
        const idEmpresa = request.idEmpresa;
        const company = await this.companyService.findById(idEmpresa);
        return response.status(200).json(company);
    }
    async update(request, response) {
        const idEmpresa = request.idEmpresa;
        await this.companyService.update(idEmpresa, request.body);
        return response.status(204).send();
    }
};
exports.CompanyController = CompanyController;
__decorate([
    (0, awilix_express_1.route)('/pay'),
    (0, awilix_express_1.POST)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "generatePay", null);
__decorate([
    (0, awilix_express_1.route)('/me'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "findById", null);
__decorate([
    (0, awilix_express_1.route)('/:id'),
    (0, awilix_express_1.PUT)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], CompanyController.prototype, "update", null);
exports.CompanyController = CompanyController = __decorate([
    (0, awilix_express_1.route)('/companies'),
    __metadata("design:paramtypes", [Object])
], CompanyController);
