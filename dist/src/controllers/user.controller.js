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
exports.UserController = void 0;
const awilix_express_1 = require("awilix-express");
let UserController = class UserController {
    constructor({ userService }) {
        this.userService = userService;
    }
    async findById(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { id } = request.params;
        const user = await this.userService.findById(idEmpresa, id);
        return response.status(200).json(user);
    }
    async create(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const data = request.body;
        data.idEmpresa = idEmpresa;
        const user = await this.userService.create(data);
        return response.status(201).json(user);
    }
    async updatePassword(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { id } = request.params;
        const { newPassword } = request.body;
        await this.userService.updatePassword(idEmpresa, id, newPassword);
        return response.status(204).send();
    }
    async delete(request, response) {
        const idEmpresa = 'f6bf0b27-7fed-4737-8b57-955ee9e09ad9';
        const { id } = request.params;
        await this.userService.delete(idEmpresa, id);
        return response.status(204).send();
    }
};
exports.UserController = UserController;
__decorate([
    (0, awilix_express_1.route)('/:id'),
    (0, awilix_express_1.GET)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findById", null);
__decorate([
    (0, awilix_express_1.POST)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "create", null);
__decorate([
    (0, awilix_express_1.route)('/:id/password'),
    (0, awilix_express_1.POST)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updatePassword", null);
__decorate([
    (0, awilix_express_1.route)('/:id'),
    (0, awilix_express_1.DELETE)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "delete", null);
exports.UserController = UserController = __decorate([
    (0, awilix_express_1.route)('/users'),
    __metadata("design:paramtypes", [Object])
], UserController);
