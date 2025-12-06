"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const company_entity_1 = require("../entities/company.entity");
const NotFound_1 = require("../erros/NotFound");
class CompanyService {
    constructor({ companyRepository }) {
        this.companyRepository = companyRepository;
    }
    async incrementCountRegisters(idEmpresa, count = 1) {
        return await this.companyRepository.incrementCountRegisters(idEmpresa, count);
    }
    async create(data) {
        const company = new company_entity_1.CompanyEntity(data);
        return this.companyRepository.create(company);
    }
    async update(id, updateData) {
        await this.findById(id);
        await this.companyRepository.update(id, updateData);
    }
    async findById(id) {
        const company = await this.companyRepository.findById(id);
        if (!company) {
            throw new NotFound_1.NotFound('Company not found');
        }
        return company;
    }
    async list() {
        return this.companyRepository.list();
    }
    async delete(id) {
        await this.findById(id);
        await this.companyRepository.delete(id);
    }
}
exports.CompanyService = CompanyService;
