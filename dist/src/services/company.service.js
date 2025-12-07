"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompanyService = void 0;
const luxon_1 = require("luxon");
const company_entity_1 = require("../entities/company.entity");
const NotFound_1 = require("../erros/NotFound");
const env_1 = require("../env");
class CompanyService {
    constructor({ companyRepository, abacatePayService, logger }) {
        this.companyRepository = companyRepository;
        this.abacatePayService = abacatePayService;
        this.logger = logger;
    }
    async generatePay(id, plan) {
        const pricingMapper = {
            [company_entity_1.CompanyPlan.BASIC]: 7990,
            [company_entity_1.CompanyPlan.COMPLETE]: 13990,
        };
        const company = await this.findById(id);
        const payQrcode = await this.abacatePayService.generatePaymentQrCode(company, pricingMapper[plan]);
        return payQrcode;
    }
    async incrementCountRegisters(id, count = 1) {
        return await this.companyRepository.incrementCountRegisters(id, count);
    }
    async create(data) {
        const company = new company_entity_1.CompanyEntity(data);
        return this.companyRepository.create(company);
    }
    async update(id, updateData) {
        const exists = await this.findById(id);
        await this.companyRepository.update(id, Object.assign(Object.assign({}, updateData), { plan: exists.plan, countRegisters: exists.countRegisters, limitRegisters: exists.limitRegisters, status: exists.status, expirationDate: exists.expirationDate }));
    }
    async updateCompanyBeforePayment(id, company) {
        await this.companyRepository.update(id, company);
    }
    async resetCountRegisters(id) {
        const company = await this.findById(id);
        const currentDate = luxon_1.DateTime.now();
        const expirationDate = luxon_1.DateTime.fromISO(company.expirationDate);
        if (currentDate >= expirationDate) {
            let newLimitRegisters = company.limitRegisters;
            if (company.plan === company_entity_1.CompanyPlan.FREE) {
                newLimitRegisters = env_1.DEFAULT_LIMIT_REGISTERS_FREE_PLAN;
            }
            await this.companyRepository.update(id, {
                countRegisters: 0,
                limitRegisters: newLimitRegisters,
                status: company_entity_1.CompanyStatus.INACTIVE,
            });
        }
        if (company.countRegisters >= company.limitRegisters && company.status !== company_entity_1.CompanyStatus.INACTIVE) {
            this.logger.warn(`Company has exceeded the limit of registers: ${company.countRegisters}/${company.limitRegisters}`);
            await this.companyRepository.update(id, {
                status: company_entity_1.CompanyStatus.INACTIVE,
            });
        }
    }
    async findById(id) {
        const company = await this.companyRepository.findById(id);
        if (!company) {
            throw new NotFound_1.NotFound('Company not found');
        }
        return company;
    }
}
exports.CompanyService = CompanyService;
