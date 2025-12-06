"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyRepository = void 0;
const company_entity_1 = require("../entities/company.entity");
class CompanyRepository {
    constructor({ databaseKnex }) {
        this.databaseKnex = databaseKnex;
    }
    async incrementCountRegisters(idEmpresa, count = 1) {
        return await this.databaseKnex('companies')
            .where({ idEmpresa: idEmpresa })
            .increment('countRegisters', count)
            .returning('*');
    }
    async create(data) {
        const [company] = await this.databaseKnex('companies').insert(data).returning('*');
        return new company_entity_1.CompanyEntity(company, company.id);
    }
    async update(id, updateData) {
        const [company] = await this.databaseKnex('companies').where({ id }).update(updateData).returning('*');
        return new company_entity_1.CompanyEntity(company, company.id);
    }
    async findById(id) {
        const company = await this.databaseKnex('companies').where({ id }).first();
        if (!company) {
            return null;
        }
        return new company_entity_1.CompanyEntity(company, company.id);
    }
    async list() {
        const companies = await this.databaseKnex('companies');
        return companies.map((company) => new company_entity_1.CompanyEntity(company, company.id));
    }
    async delete(id) {
        await this.databaseKnex('companies').where({ id }).del();
    }
}
exports.CompanyRepository = CompanyRepository;
